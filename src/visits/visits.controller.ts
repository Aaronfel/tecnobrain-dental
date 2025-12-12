import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { VisitStatus, UserType } from '@prisma/client';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { VisitResponseDto } from './dto/visit-response.dto';
import { Roles } from '../users/decorators/roles.decorator';
import { RolesGuard } from '../users/guards/roles.guard';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { UserResponseDto } from '../users/dto/user-response.dto';

/**
 * Controller for visit operations
 */
@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  /**
   * Creates a new visit (Clinic, Admin, or Patient)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserType.CLINIC, UserType.ADMIN, UserType.PATIENT)
  @HttpCode(HttpStatus.CREATED)
  async createVisit(
    @Body() createVisitDto: CreateVisitDto,
    @CurrentUser() user: UserResponseDto,
  ): Promise<VisitResponseDto> {
    // If clinic user, ensure they can only create visits for their clinic
    if (user.userType === UserType.CLINIC) {
      createVisitDto.clinicId = user.id;
    }

    // If patient user, enforce patient-specific constraints
    if (user.userType === UserType.PATIENT) {
      if (!user.clinicId) {
        throw new BadRequestException(
          'El paciente debe estar asignado a una clínica',
        );
      }
      createVisitDto.patientId = user.id;
      createVisitDto.clinicId = user.clinicId;
      createVisitDto.status = VisitStatus.PROGRAMADA;
    }

    return this.visitsService.createVisit(createVisitDto, user);
  }

  /**
   * Gets all visits (Admin only)
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  async findAllVisits(): Promise<VisitResponseDto[]> {
    return this.visitsService.findAllVisits();
  }

  /**
   * Gets occupied time slots for a clinic within a date range
   */
  @Get('occupied')
  async getOccupiedSlots(
    @Query('clinicId', ParseIntPipe) clinicId: number,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ): Promise<VisitResponseDto[]> {
    return this.visitsService.getOccupiedSlots(clinicId, dateFrom, dateTo);
  }

  /**
   * Gets visits for a specific clinic
   */
  @Get('clinic/:clinicId')
  @UseGuards(RolesGuard)
  @Roles(UserType.CLINIC, UserType.ADMIN)
  async findClinicVisits(
    @Param('clinicId', ParseIntPipe) clinicId: number,
    @CurrentUser() user: UserResponseDto,
  ): Promise<VisitResponseDto[]> {
    // If clinic user, ensure they can only see their own visits
    if (user.userType === UserType.CLINIC && user.id !== clinicId) {
      clinicId = user.id;
    }
    
    return this.visitsService.findClinicVisits(clinicId);
  }

  /**
   * Gets visits for a specific patient
   */
  @Get('patient/:patientId')
  @UseGuards(RolesGuard)
  @Roles(UserType.PATIENT, UserType.CLINIC, UserType.ADMIN)
  async findPatientVisits(
    @Param('patientId', ParseIntPipe) patientId: number,
    @CurrentUser() user: UserResponseDto,
  ): Promise<VisitResponseDto[]> {
    // If patient user, ensure they can only see their own visits
    if (user.userType === UserType.PATIENT && user.id !== patientId) {
      patientId = user.id;
    }
    
    return this.visitsService.findPatientVisits(patientId);
  }

  /**
   * Gets a visit by ID
   */
  @Get(':id')
  async findVisitById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<VisitResponseDto> {
    return this.visitsService.findVisitById(id);
  }

  /**
   * Updates a visit
   */
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserType.CLINIC, UserType.ADMIN, UserType.PATIENT)
  async updateVisit(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVisitDto: UpdateVisitDto,
    @CurrentUser() user: UserResponseDto,
  ): Promise<VisitResponseDto> {
    // If clinic user, ensure they can only update visits for their clinic
    if (user.userType === UserType.CLINIC && updateVisitDto.clinicId) {
      updateVisitDto.clinicId = user.id;
    }

    // If patient user, enforce constraints (can't change critical fields)
    if (user.userType === UserType.PATIENT) {
      delete updateVisitDto.patientId;
      delete updateVisitDto.clinicId;
      delete updateVisitDto.status; // Patients can't change status
    }

    return this.visitsService.updateVisit(id, updateVisitDto, user);
  }

  /**
   * Updates visit status
   */
  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserType.CLINIC, UserType.ADMIN)
  async updateVisitStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: VisitStatus },
  ): Promise<VisitResponseDto> {
    return this.visitsService.updateVisitStatus(id, body.status);
  }

  /**
   * Deletes a visit
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserType.CLINIC, UserType.ADMIN, UserType.PATIENT)
  async deleteVisit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserResponseDto,
  ): Promise<VisitResponseDto> {
    return this.visitsService.deleteVisit(id, user);
  }
}
