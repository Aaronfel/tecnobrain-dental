import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsInt,
  ValidateIf,
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

  @ValidateIf((o) => o.userType !== UserType.PATIENT)
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password?: string;

  @IsEnum(UserType)
  userType: UserType;

  @IsOptional()
  @IsInt()
  clinicId?: number;
}
