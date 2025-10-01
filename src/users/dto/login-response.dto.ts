import { UserResponseDto } from './user-response.dto';

/**
 * DTO for login response
 */
export class LoginResponseDto {
  user: UserResponseDto;
  accessToken: string;
}
