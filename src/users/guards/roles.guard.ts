import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserResponseDto } from '../dto/user-response.dto';

/**
 * Guard to check if the current user has the required user types
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredUserTypes = this.reflector.getAllAndOverride<UserType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredUserTypes) {
      return true;
    }

    const { user }: { user: UserResponseDto } = context
      .switchToHttp()
      .getRequest();

    return requiredUserTypes.some((userType) => user.userType === userType);
  }
}
