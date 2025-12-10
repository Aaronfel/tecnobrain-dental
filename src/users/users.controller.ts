import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserType } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

/**
 * Controller for user operations
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Creates a new user (Public route)
   */
  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.createUser(createUserDto);
  }

  /**
   * Authenticates a user and returns JWT token (Public route)
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginUser(
    @Body() loginUserDto: LoginUserDto,
  ): Promise<LoginResponseDto> {
    return this.usersService.loginUser(loginUserDto);
  }

  /**
   * Gets all users (Admin only)
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  async findAllUsers(): Promise<UserResponseDto[]> {
    return this.usersService.findAllUsers();
  }

  /**
   * Gets current user profile (Protected route)
   */
  @Get('me')
  async getCurrentUser(
    @CurrentUser() user: UserResponseDto,
  ): Promise<UserResponseDto> {
    return user;
  }

  /**
   * Gets a user by ID
   */
  @Get(':id')
  async findUserById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    return this.usersService.findUserById(id);
  }

  /**
   * Changes user's password (Protected route)
   */
  @Put('change-password')
  async changePassword(
    @CurrentUser() user: UserResponseDto,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<UserResponseDto> {
    return this.usersService.changePassword(user.id, changePasswordDto);
  }

  /**
   * Updates a user by ID
   */
  @Put(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUser(id, updateUserDto);
  }

  /**
   * Deletes a user by ID
   */
  @Delete(':id')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    return this.usersService.deleteUser(id);
  }

  /**
   * Gets all patients for a specific clinic
   */
  @Get('clinic/:clinicId/patients')
  @UseGuards(RolesGuard)
  @Roles(UserType.CLINIC, UserType.ADMIN)
  async findClinicPatients(
    @Param('clinicId', ParseIntPipe) clinicId: number,
  ): Promise<UserResponseDto[]> {
    return this.usersService.findClinicPatients(clinicId);
  }

  /**
   * Assigns a patient to a clinic (Admin only)
   */
  @Post('patient/:patientId/assign-clinic/:clinicId')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @HttpCode(HttpStatus.OK)
  async assignPatientToClinic(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('clinicId', ParseIntPipe) clinicId: number,
  ): Promise<UserResponseDto> {
    return this.usersService.assignPatientToClinic(patientId, clinicId);
  }

  /**
   * Removes a patient from a clinic (Admin only)
   */
  @Delete('patient/:patientId/clinic')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  async removePatientFromClinic(
    @Param('patientId', ParseIntPipe) patientId: number,
  ): Promise<UserResponseDto> {
    return this.usersService.removePatientFromClinic(patientId);
  }

  /**
   * Test endpoint for health check (Public route)
   */
  @Public()
  @Get('admin/test')
  async testEndpoint(): Promise<{ message: string; timestamp: string }> {
    return {
      message: 'Users module is working correctly',
      timestamp: new Date().toISOString(),
    };
  }
}
