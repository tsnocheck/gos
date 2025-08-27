import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ChangePasswordDto,
  CreateUserDto,
  UpdateUserDto,
} from './dto/user.dto';
import { AdminUpdateUserDto, UpdateUserStatusDto } from './dto/admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './enums/user.enum';
import { UserResponseHelper } from './helpers/user-response.helper';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return UserResponseHelper.toUserResponse(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return this.usersService.findOnePublic(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(req.user.id, updateUserDto);
    return UserResponseHelper.toUserResponse(user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile/password')
  changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOnePublic(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // Административные эндпоинты
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/all')
  getAllUsers() {
    return this.usersService.findAllUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/stats')
  getUserStats() {
    return this.usersService.getUserStats();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('admin/:id')
  async adminUpdateUser(
    @Param('id') id: string,
    @Body() updateUserDto: AdminUpdateUserDto,
  ) {
    const user = await this.usersService.update(id, updateUserDto);
    return UserResponseHelper.toUserResponse(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('admin/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateUserStatusDto,
  ) {
    const user = await this.usersService.updateUserStatus(id, statusDto.status);
    return UserResponseHelper.toUserResponse(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('admin/:id/soft')
  async softDeleteUser(@Param('id') id: string) {
    const user = await this.usersService.softDeleteUser(id);
    return UserResponseHelper.toUserResponse(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('admin/:id/hard')
  hardDeleteUser(@Param('id') id: string) {
    return this.usersService.hardDeleteUser(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('admin/:id/reset-password')
  resetUserPassword(@Param('id') id: string) {
    return this.usersService.resetUserPassword(id);
  }
}
