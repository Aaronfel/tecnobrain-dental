import { IsEmail, IsString } from 'class-validator';

/**
 * DTO for user login
 */
export class LoginUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
