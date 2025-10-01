import { SetMetadata } from '@nestjs/common';
import { UserType } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required user types for accessing a route
 * Usage: @Roles(UserType.ADMIN, UserType.CLINIC)
 */
export const Roles = (...userTypes: UserType[]) => SetMetadata(ROLES_KEY, userTypes);
