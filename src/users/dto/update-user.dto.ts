import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  IsInt,
} from 'class-validator';
import { UserType } from '@prisma/client';

/**
 * DTO for updating an existing user
 */
export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsEnum(UserType)
  @IsOptional()
  userType?: UserType;

  @IsOptional()
  @IsInt()
  clinicId?: number;
}
