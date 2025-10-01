import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users.service';
import { UserResponseDto } from '../dto/user-response.dto';

/**
 * JWT Strategy for validating JWT tokens
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'default-secret-key',
    });
  }

  /**
   * Validates the JWT payload and returns the user
   */
  async validate(payload: any): Promise<UserResponseDto> {
    const { sub: userId } = payload;

    try {
      const user = await this.usersService.findUserById(userId);
      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
