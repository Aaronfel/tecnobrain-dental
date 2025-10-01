import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserResponseDto } from '../dto/user-response.dto';

/**
 * Decorator to extract the current authenticated user from the request
 * Usage: getCurrentUser(@CurrentUser() user: UserResponseDto)
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserResponseDto => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
