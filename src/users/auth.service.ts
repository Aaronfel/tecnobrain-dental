import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserResponseDto } from './dto/user-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';

/**
 * Service for handling authentication operations
 */
@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Hashes a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compares a plain password with a hashed password
   */
  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generates a JWT access token for a user
   */
  async generateAccessToken(user: UserResponseDto): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      userType: user.userType,
      clinicId: user.clinicId,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Creates a login response with user data and access token
   */
  async createLoginResponse(user: UserResponseDto): Promise<LoginResponseDto> {
    const accessToken = await this.generateAccessToken(user);

    return {
      user,
      accessToken,
    };
  }

  /**
   * Validates a password and throws UnauthorizedException if invalid
   */
  async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<void> {
    const isValid = await this.comparePassword(password, hashedPassword);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}
