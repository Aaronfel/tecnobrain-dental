import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { VisitStatus, VisitType, UserType } from '@prisma/client';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { VisitResponseDto } from './dto/visit-response.dto';

/**
 * Service for handling visit operations
 */
@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Creates a new visit
   */
  async createVisit(createVisitDto: CreateVisitDto): Promise<VisitResponseDto> {
    const { startTime, endTime, patientId, clinicId } = createVisitDto;

    // Validate patient exists and is a patient
    const patient = await this.prisma.user.findUnique({
      where: { id: patientId },
    });
    if (!patient || patient.userType !== UserType.PATIENT) {
      throw new BadRequestException(`Patient with ID ${patientId} not found`);
    }

    // Validate clinic exists and is a clinic
    const clinic = await this.prisma.user.findUnique({
      where: { id: clinicId },
    });
    if (!clinic || clinic.userType !== UserType.CLINIC) {
      throw new BadRequestException(`Clinic with ID ${clinicId} not found`);
    }

    // Check if patient belongs to this clinic
    if (patient.clinicId !== clinicId) {
      throw new BadRequestException('Patient does not belong to this clinic');
    }

    // Check for time conflicts
    await this.checkTimeConflict(clinicId, startTime, endTime);

    // Create visit
    const visit = await this.prisma.visit.create({
      data: {
        ...createVisitDto,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: createVisitDto.status || VisitStatus.PROGRAMADA,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send email notifications
    await this.sendVisitScheduledEmails(visit);

    return this.mapToVisitResponse(visit);
  }

  /**
   * Finds all visits
   */
  async findAllVisits(): Promise<VisitResponseDto[]> {
    const visits = await this.prisma.visit.findMany({
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return visits.map((visit) => this.mapToVisitResponse(visit));
  }

  /**
   * Finds a visit by ID
   */
  async findVisitById(id: number): Promise<VisitResponseDto> {
    const visit = await this.prisma.visit.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException(`Visit with ID ${id} not found`);
    }

    return this.mapToVisitResponse(visit);
  }

  /**
   * Finds visits for a specific clinic
   */
  async findClinicVisits(clinicId: number): Promise<VisitResponseDto[]> {
    // Validate clinic exists
    const clinic = await this.prisma.user.findUnique({
      where: { id: clinicId },
    });
    if (!clinic || clinic.userType !== UserType.CLINIC) {
      throw new BadRequestException(`Clinic with ID ${clinicId} not found`);
    }

    const visits = await this.prisma.visit.findMany({
      where: { clinicId },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return visits.map((visit) => this.mapToVisitResponse(visit));
  }

  /**
   * Finds visits for a specific patient
   */
  async findPatientVisits(patientId: number): Promise<VisitResponseDto[]> {
    // Validate patient exists
    const patient = await this.prisma.user.findUnique({
      where: { id: patientId },
    });
    if (!patient || patient.userType !== UserType.PATIENT) {
      throw new BadRequestException(`Patient with ID ${patientId} not found`);
    }

    const visits = await this.prisma.visit.findMany({
      where: { patientId },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return visits.map((visit) => this.mapToVisitResponse(visit));
  }

  /**
   * Gets occupied time slots for a clinic within a date range
   */
  async getOccupiedSlots(
    clinicId: number,
    dateFrom: string,
    dateTo: string,
  ): Promise<VisitResponseDto[]> {
    // Validate clinic exists
    const clinic = await this.prisma.user.findUnique({
      where: { id: clinicId },
    });
    if (!clinic || clinic.userType !== UserType.CLINIC) {
      throw new BadRequestException(`Clinic with ID ${clinicId} not found`);
    }

    const visits = await this.prisma.visit.findMany({
      where: {
        clinicId,
        startTime: {
          gte: new Date(dateFrom),
        },
        endTime: {
          lte: new Date(dateTo),
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return visits.map((visit) => this.mapToVisitResponse(visit));
  }

  /**
   * Updates a visit
   */
  async updateVisit(
    id: number,
    updateVisitDto: UpdateVisitDto,
  ): Promise<VisitResponseDto> {
    // Check if visit exists
    const existingVisit = await this.prisma.visit.findUnique({
      where: { id },
    });
    if (!existingVisit) {
      throw new NotFoundException(`Visit with ID ${id} not found`);
    }

    // If updating time, check for conflicts
    if (updateVisitDto.startTime || updateVisitDto.endTime) {
      const startTime =
        updateVisitDto.startTime || existingVisit.startTime.toISOString();
      const endTime =
        updateVisitDto.endTime || existingVisit.endTime.toISOString();
      await this.checkTimeConflict(
        existingVisit.clinicId,
        startTime,
        endTime,
        id,
      );
    }

    // Prepare update data
    const updateData: any = { ...updateVisitDto };
    if (updateVisitDto.startTime) {
      updateData.startTime = new Date(updateVisitDto.startTime);
    }
    if (updateVisitDto.endTime) {
      updateData.endTime = new Date(updateVisitDto.endTime);
    }

    // Update visit
    const visit = await this.prisma.visit.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send email notifications
    await this.sendVisitUpdatedEmails(visit);

    return this.mapToVisitResponse(visit);
  }

  /**
   * Updates visit status
   */
  async updateVisitStatus(
    id: number,
    status: VisitStatus,
  ): Promise<VisitResponseDto> {
    const visit = await this.prisma.visit.update({
      where: { id },
      data: { status },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return this.mapToVisitResponse(visit);
  }

  /**
   * Deletes a visit
   */
  async deleteVisit(id: number): Promise<VisitResponseDto> {
    // Check if visit exists and get full data for email
    const existingVisit = await this.prisma.visit.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    if (!existingVisit) {
      throw new NotFoundException(`Visit with ID ${id} not found`);
    }

    // Delete visit
    const visit = await this.prisma.visit.delete({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send email notifications
    await this.sendVisitCanceledEmails(visit);

    return this.mapToVisitResponse(visit);
  }

  /**
   * Checks for time conflicts with existing visits
   */
  private async checkTimeConflict(
    clinicId: number,
    startTime: string,
    endTime: string,
    excludeVisitId?: number,
  ): Promise<void> {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const conflictingVisit = await this.prisma.visit.findFirst({
      where: {
        clinicId,
        id: excludeVisitId ? { not: excludeVisitId } : undefined,
        OR: [
          {
            startTime: {
              lt: end,
              gte: start,
            },
          },
          {
            endTime: {
              gt: start,
              lte: end,
            },
          },
          {
            startTime: { lte: start },
            endTime: { gte: end },
          },
        ],
      },
    });

    if (conflictingVisit) {
      throw new ConflictException('Time slot conflicts with an existing visit');
    }
  }

  /**
   * Formats date and time in Spanish
   */
  private formatDateTimeInSpanish(startTime: Date, endTime: Date): string {
    const days = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];
    const months = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    const start = new Date(startTime);
    const end = new Date(endTime);
    const dayName = days[start.getDay()];
    const day = start.getDate();
    const month = months[start.getMonth()];
    const year = start.getFullYear();
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    const endHour = end.getHours();
    const endMinute = end.getMinutes();
    const startAmPm = startHour >= 12 ? 'PM' : 'AM';
    const endAmPm = endHour >= 12 ? 'PM' : 'AM';
    const startHour12 = startHour % 12 || 12;
    const endHour12 = endHour % 12 || 12;
    const startMinuteStr = startMinute.toString().padStart(2, '0');
    const endMinuteStr = endMinute.toString().padStart(2, '0');
    return `${dayName}, ${day} de ${month} de ${year}, ${startHour12}:${startMinuteStr} ${startAmPm} - ${endHour12}:${endMinuteStr} ${endAmPm}`;
  }

  /**
   * Formats visit type for display
   */
  private formatVisitType(type: VisitType): string {
    return type.charAt(0) + type.slice(1).toLowerCase();
  }

  private async sendVisitScheduledEmails(visit: any): Promise<void> {
    try {
      const formattedDateTime = this.formatDateTimeInSpanish(
        visit.startTime,
        visit.endTime,
      );
      const formattedVisitType = this.formatVisitType(visit.type);
      const patientEmailContext = {
        patientName: visit.patient.name,
        clinicName: visit.clinic.name,
        patientEmail: visit.patient.email,
        clinicEmail: visit.clinic.email,
        visitTitle: visit.title,
        visitType: formattedVisitType,
        formattedDateTime,
        notes: visit.notes || null,
        visitId: visit.id,
      };
      const clinicEmailContext = {
        patientName: visit.patient.name,
        clinicName: visit.clinic.name,
        patientEmail: visit.patient.email,
        clinicEmail: visit.clinic.email,
        visitTitle: visit.title,
        visitType: formattedVisitType,
        formattedDateTime,
        notes: visit.notes || null,
        visitId: visit.id,
      };
      await Promise.all([
        this.mailService.sendMail(
          visit.patient.email,
          'visit-scheduled-patient',
          patientEmailContext,
          'Cita Programada - DentalCare Pro',
        ),
        this.mailService.sendMail(
          visit.clinic.email,
          'visit-scheduled-clinic',
          clinicEmailContext,
          `Nueva Cita Programada - ${visit.patient.name}`,
        ),
      ]);
    } catch (error) {
      console.error('Error sending visit scheduled emails:', error);
    }
  }

  /**
   * Sends email notifications to patient and clinic when a visit is canceled
   */
  private async sendVisitCanceledEmails(visit: any): Promise<void> {
    try {
      const formattedDateTime = this.formatDateTimeInSpanish(
        visit.startTime,
        visit.endTime,
      );
      const formattedVisitType = this.formatVisitType(visit.type);
      const patientEmailContext = {
        patientName: visit.patient.name,
        clinicName: visit.clinic.name,
        patientEmail: visit.patient.email,
        clinicEmail: visit.clinic.email,
        visitTitle: visit.title,
        visitType: formattedVisitType,
        formattedDateTime,
        notes: visit.notes || null,
        visitId: visit.id,
      };
      const clinicEmailContext = {
        patientName: visit.patient.name,
        clinicName: visit.clinic.name,
        patientEmail: visit.patient.email,
        clinicEmail: visit.clinic.email,
        visitTitle: visit.title,
        visitType: formattedVisitType,
        formattedDateTime,
        notes: visit.notes || null,
        visitId: visit.id,
      };
      await Promise.all([
        this.mailService.sendMail(
          visit.patient.email,
          'visit-canceled-patient',
          patientEmailContext,
          'Cita Cancelada - DentalCare Pro',
        ),
        this.mailService.sendMail(
          visit.clinic.email,
          'visit-canceled-clinic',
          clinicEmailContext,
          `Cita Cancelada - ${visit.patient.name}`,
        ),
      ]);
    } catch (error) {
      console.error('Error sending visit canceled emails:', error);
    }
  }

  /**
   * Sends email notifications to patient and clinic when a visit is updated
   */
  private async sendVisitUpdatedEmails(visit: any): Promise<void> {
    try {
      const formattedDateTime = this.formatDateTimeInSpanish(
        visit.startTime,
        visit.endTime,
      );
      const formattedVisitType = this.formatVisitType(visit.type);
      const patientEmailContext = {
        patientName: visit.patient.name,
        clinicName: visit.clinic.name,
        patientEmail: visit.patient.email,
        clinicEmail: visit.clinic.email,
        visitTitle: visit.title,
        visitType: formattedVisitType,
        formattedDateTime,
        notes: visit.notes || null,
        visitId: visit.id,
      };
      const clinicEmailContext = {
        patientName: visit.patient.name,
        clinicName: visit.clinic.name,
        patientEmail: visit.patient.email,
        clinicEmail: visit.clinic.email,
        visitTitle: visit.title,
        visitType: formattedVisitType,
        formattedDateTime,
        notes: visit.notes || null,
        visitId: visit.id,
      };
      await Promise.all([
        this.mailService.sendMail(
          visit.patient.email,
          'visit-updated-patient',
          patientEmailContext,
          'Cita Actualizada - DentalCare Pro',
        ),
        this.mailService.sendMail(
          visit.clinic.email,
          'visit-updated-clinic',
          clinicEmailContext,
          `Cita Actualizada - ${visit.patient.name}`,
        ),
      ]);
    } catch (error) {
      console.error('Error sending visit updated emails:', error);
    }
  }

  /**
   * Maps a Visit entity to VisitResponseDto
   */
  private mapToVisitResponse(visit: any): VisitResponseDto {
    return {
      id: visit.id,
      title: visit.title,
      startTime: visit.startTime,
      endTime: visit.endTime,
      type: visit.type,
      status: visit.status,
      notes: visit.notes,
      patientId: visit.patientId,
      clinicId: visit.clinicId,
      createdAt: visit.createdAt,
      updatedAt: visit.updatedAt,
      patient: visit.patient,
      clinic: visit.clinic,
    };
  }
}
