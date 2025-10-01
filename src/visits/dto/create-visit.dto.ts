import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { VisitType, VisitStatus } from '@prisma/client';

/**
 * DTO for creating a new visit
 */
export class CreateVisitDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsEnum(VisitType)
  type: VisitType;

  @IsEnum(VisitStatus)
  @IsOptional()
  status?: VisitStatus;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsInt()
  patientId: number;

  @IsInt()
  clinicId: number;
}
