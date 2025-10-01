import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsInt,
} from 'class-validator';
import { UserType } from '@prisma/client';

/**
 * DTO for creating a new user
 */
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserType)
  userType: UserType;

  @IsOptional()
  @IsInt()
  clinicId?: number; // For patients, specify which clinic they belong to
}
