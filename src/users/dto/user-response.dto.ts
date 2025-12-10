import { UserType } from '@prisma/client';

/**
 * DTO for user response (excludes sensitive data)
 */
export class UserResponseDto {
  id: number;
  name: string;
  email: string;
  userType: UserType;
  clinicId?: number;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}
