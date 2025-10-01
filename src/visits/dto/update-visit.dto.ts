import {
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { VisitType, VisitStatus } from '@prisma/client';

/**
 * DTO for updating an existing visit
 */
export class UpdateVisitDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsEnum(VisitType)
  @IsOptional()
  type?: VisitType;

  @IsEnum(VisitStatus)
  @IsOptional()
  status?: VisitStatus;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsInt()
  @IsOptional()
  patientId?: number;

  @IsInt()
  @IsOptional()
  clinicId?: number;
}
