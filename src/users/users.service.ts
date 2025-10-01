import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserType } from '@prisma/client';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';

/**
 * Service for handling user operations
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Creates a new user with encrypted password
   */
  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, password, clinicId, ...userData } = createUserDto;

    // Check if user already exists
    const existingUser = await this.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // If creating a patient, validate clinic exists
    if (userData.userType === UserType.PATIENT && clinicId) {
      const clinic = await this.prisma.user.findUnique({
        where: { id: clinicId },
      });
      if (!clinic || clinic.userType !== UserType.CLINIC) {
        throw new BadRequestException('Invalid clinic ID');
      }
    }

    // Hash password
    const passwordHash = await this.authService.hashPassword(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        ...userData,
        email,
        passwordHash,
        clinicId: userData.userType === UserType.PATIENT ? clinicId : null,
      },
    });

    return this.mapToUserResponse(user);
  }

  /**
   * Finds all users (excluding password hash)
   */
  async findAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      include: {
        patients: true,
        clinic: true,
      },
    });

    return users.map((user) => this.mapToUserResponse(user));
  }

  /**
   * Finds a user by ID
   */
  async findUserById(id: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        patients: true,
        clinic: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.mapToUserResponse(user);
  }

  /**
   * Finds a user by email (includes password hash for authentication)
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Updates a user
   */
  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const { email, password, clinicId, ...userData } = updateUserDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check email uniqueness if email is being updated
    if (email && email !== existingUser.email) {
      const userWithEmail = await this.findUserByEmail(email);
      if (userWithEmail) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // If updating to patient, validate clinic exists
    if (userData.userType === UserType.PATIENT && clinicId) {
      const clinic = await this.prisma.user.findUnique({
        where: { id: clinicId },
      });
      if (!clinic || clinic.userType !== UserType.CLINIC) {
        throw new BadRequestException('Invalid clinic ID');
      }
    }

    // Prepare update data
    const updateData: any = { ...userData };
    if (email) updateData.email = email;
    if (password) {
      updateData.passwordHash = await this.authService.hashPassword(password);
    }
    if (userData.userType === UserType.PATIENT) {
      updateData.clinicId = clinicId;
    } else {
      updateData.clinicId = null;
    }

    // Update user
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return this.mapToUserResponse(user);
  }

  /**
   * Deletes a user
   */
  async deleteUser(id: number): Promise<UserResponseDto> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Delete user (cascade will handle related records)
    const user = await this.prisma.user.delete({
      where: { id },
    });

    return this.mapToUserResponse(user);
  }

  /**
   * Authenticates a user and returns login response with JWT token
   */
  async loginUser(loginUserDto: LoginUserDto): Promise<LoginResponseDto> {
    const { email, password } = loginUserDto;

    // Find user by email
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    // Validate password
    await this.authService.validatePassword(password, user.passwordHash);

    // Create login response
    const userResponse = this.mapToUserResponse(user);
    return this.authService.createLoginResponse(userResponse);
  }

  /**
   * Gets all patients for a specific clinic
   */
  async findClinicPatients(clinicId: number): Promise<UserResponseDto[]> {
    // Check if clinic exists
    const clinic = await this.prisma.user.findUnique({
      where: { id: clinicId },
    });
    if (!clinic || clinic.userType !== UserType.CLINIC) {
      throw new BadRequestException(`Clinic with ID ${clinicId} not found`);
    }

    const patients = await this.prisma.user.findMany({
      where: {
        clinicId: clinicId,
        userType: UserType.PATIENT,
      },
      include: {
        clinic: true,
      },
    });

    return patients.map((patient) => this.mapToUserResponse(patient));
  }

  /**
   * Assigns a patient to a clinic
   */
  async assignPatientToClinic(
    patientId: number,
    clinicId: number,
  ): Promise<UserResponseDto> {
    // Check if patient exists
    const patient = await this.prisma.user.findUnique({
      where: { id: patientId },
    });
    if (!patient || patient.userType !== UserType.PATIENT) {
      throw new BadRequestException(`Patient with ID ${patientId} not found`);
    }

    // Check if clinic exists
    const clinic = await this.prisma.user.findUnique({
      where: { id: clinicId },
    });
    if (!clinic || clinic.userType !== UserType.CLINIC) {
      throw new BadRequestException(`Clinic with ID ${clinicId} not found`);
    }

    // Update patient's clinic
    const updatedPatient = await this.prisma.user.update({
      where: { id: patientId },
      data: { clinicId },
    });

    return this.mapToUserResponse(updatedPatient);
  }

  /**
   * Removes a patient from a clinic
   */
  async removePatientFromClinic(patientId: number): Promise<UserResponseDto> {
    // Check if patient exists
    const patient = await this.prisma.user.findUnique({
      where: { id: patientId },
    });
    if (!patient || patient.userType !== UserType.PATIENT) {
      throw new BadRequestException(`Patient with ID ${patientId} not found`);
    }

    // Remove clinic assignment
    const updatedPatient = await this.prisma.user.update({
      where: { id: patientId },
      data: { clinicId: null },
    });

    return this.mapToUserResponse(updatedPatient);
  }

  /**
   * Maps a User entity to UserResponseDto (excludes sensitive data)
   */
  private mapToUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      clinicId: user.clinicId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
