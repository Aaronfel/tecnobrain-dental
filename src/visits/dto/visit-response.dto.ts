import { VisitType, VisitStatus } from '@prisma/client';

/**
 * DTO for visit response
 */
export class VisitResponseDto {
  id: number;
  title: string;
  startTime: Date;
  endTime: Date;
  type: VisitType;
  status: VisitStatus;
  notes?: string;
  patientId: number;
  clinicId: number;
  createdAt: Date;
  updatedAt: Date;
  patient?: {
    id: number;
    name: string;
    email: string;
  };
  clinic?: {
    id: number;
    name: string;
    email: string;
  };
}
