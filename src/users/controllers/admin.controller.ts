import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
  Request,
  Delete,
} from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole, UserStatus } from '../enums/user.enum';
import {
  AdminCreateUserDto,
  AdminUpdateUserDto,
  ChangeUserRoleDto,
  ChangeUserStatusDto,
  AssignRolesDto,
  AddRoleDto,
  RemoveRoleDto,
} from '../dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // 1.1 Принятие нового пользователя в систему
  @Post('users/:id/approve')
  async approveUser(@Param('id') userId: string) {
    return this.adminService.approveUser(userId);
  }

  // 1.1 Создание пользователя
  @Post('users')
  async createUser(@Body() createUserDto: AdminCreateUserDto) {
    return this.adminService.createUser(createUserDto);
  }

  // 1.2 Назначение и смена ролей пользователя (устаревший метод, заменен на assign-roles)
  @Patch('users/role')
  async changeUserRole(@Body() changeRoleDto: ChangeUserRoleDto, @Request() req) {
    // Преобразуем одну роль в массив для совместимости
    return this.adminService.assignRoles(changeRoleDto.userId, [changeRoleDto.role], req.user);
  }

  // 1.2 Смена статуса пользователя
  @Patch('users/status')
  async changeUserStatus(@Body() changeStatusDto: ChangeUserStatusDto) {
    return this.adminService.changeUserStatus(changeStatusDto);
  }

  // 1.3 Редактирование данных пользователей
  @Patch('users/:id')
  async updateUser(
    @Param('id') userId: string,
    @Body() updateUserDto: AdminUpdateUserDto,
  ) {
    return this.adminService.updateUser(userId, updateUserDto);
  }

  // 1.4 Отправка приглашений по смене пароля
  @Post('users/:id/send-invitation')
  async sendPasswordResetInvitation(@Param('id') userId: string) {
    await this.adminService.sendPasswordResetInvitation(userId);
    return { message: 'Invitation sent successfully' };
  }

  // 1.5 Отправка в архив
  @Post('users/:id/archive')
  async archiveUser(@Param('id') userId: string) {
    return this.adminService.archiveUser(userId);
  }

  // 1.5 Возвращение из архива
  @Post('users/:id/unarchive')
  async unarchiveUser(@Param('id') userId: string) {
    return this.adminService.unarchiveUser(userId);
  }

  // 1.6 Удаление (сокрытие) пользователя
  @Post('users/:id/hide')
  async hideUser(@Param('id') userId: string) {
    return this.adminService.hideUser(userId);
  }

  // Получение всех пользователей
  @Get('users')
  async getAllUsers(@Query('includeHidden') includeHidden?: string) {
    return this.adminService.getAllUsers(includeHidden === 'true');
  }

  // Получение пользователей по статусу
  @Get('users/status/:status')
  async getUsersByStatus(@Param('status') status: UserStatus) {
    return this.adminService.getUsersByStatus(status);
  }

  // Получение пользователей по роли
  @Get('users/role/:role')
  async getUsersByRole(@Param('role') role: UserRole) {
    return this.adminService.getUsersByRole(role);
  }

  // Получение неактивных пользователей (ожидающих одобрения)
  @Get('users/pending')
  async getPendingUsers() {
    return this.adminService.getPendingUsers();
  }

  // Управление множественными ролями
  @Post('assign-roles')
  async assignRoles(@Body() assignRolesDto: AssignRolesDto, @Request() req) {
    return await this.adminService.assignRoles(
      assignRolesDto.userId,
      assignRolesDto.roles,
      req.user,
    );
  }

  @Post('add-role')
  async addRole(@Body() addRoleDto: AddRoleDto, @Request() req) {
    return await this.adminService.addRole(
      addRoleDto.userId,
      addRoleDto.role,
      req.user,
    );
  }

  @Post('remove-role')
  async removeRole(@Body() removeRoleDto: RemoveRoleDto, @Request() req) {
    return await this.adminService.removeRole(
      removeRoleDto.userId,
      removeRoleDto.role,
      req.user,
    );
  }

  // A1.4 Расширенная административная таблица пользователей
  @Get('users/table')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUsersTable(
    @Request() req,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
    @Query('workplace') workplace?: string,
    @Query('department') department?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filters = {
      search,
      role,
      status,
      workplace,
      department,
      sortBy,
      sortOrder,
      page: page ? parseInt(page.toString()) : undefined,
      limit: limit ? parseInt(limit.toString()) : undefined,
    };

    return this.adminService.getAdminUsersTable(req.user, filters);
  }

  @Patch('users/bulk-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async bulkUpdateUsers(
    @Request() req,
    @Body() updateData: {
      userIds: string[];
      updates: {
        roles?: UserRole[];
        status?: UserStatus;
        workplace?: string;
        department?: string;
      };
    },
  ) {
    return this.adminService.bulkUpdateUsers(req.user, updateData.userIds, updateData.updates);
  }

  // A1.5 Административная таблица экспертов
  @Get('experts/table')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getExpertsTable(
    @Request() req,
    @Query('search') search?: string,
    @Query('subject') subject?: string,
    @Query('region') region?: string,
    @Query('workplace') workplace?: string,
    @Query('isActive') isActive?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filters = {
      search,
      subject,
      region,
      workplace,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      sortBy,
      sortOrder,
      page: page ? parseInt(page.toString()) : undefined,
      limit: limit ? parseInt(limit.toString()) : undefined,
    };

    return this.adminService.getAdminExpertsTable(req.user, filters);
  }

  @Patch('expertises/:expertiseId/reassign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async reassignExpert(
    @Request() req,
    @Param('expertiseId') expertiseId: string,
    @Body() data: { newExpertId: string },
  ) {
    await this.adminService.reassignExpert(req.user, expertiseId, data.newExpertId);
    return { message: 'Эксперт успешно переназначен' };
  }

  // A1.6 Административная таблица программ
  @Get('programs/table')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getProgramsTable(
    @Request() req,
    @Query('search') search?: string,
    @Query('authorId') authorId?: string,
    @Query('status') status?: string,
    @Query('subject') subject?: string,
    @Query('targetAudience') targetAudience?: string,
    @Query('category') category?: string,
    @Query('hasExpertise') hasExpertise?: string,
    @Query('createdFrom') createdFrom?: string,
    @Query('createdTo') createdTo?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filters = {
      search,
      authorId,
      status,
      subject,
      targetAudience,
      category,
      hasExpertise: hasExpertise === 'true' ? true : hasExpertise === 'false' ? false : undefined,
      createdFrom: createdFrom ? new Date(createdFrom) : undefined,
      createdTo: createdTo ? new Date(createdTo) : undefined,
      sortBy,
      sortOrder,
      page: page ? parseInt(page.toString()) : undefined,
      limit: limit ? parseInt(limit.toString()) : undefined,
    };

    return this.adminService.getAdminProgramsTable(req.user, filters);
  }

  @Patch('programs/bulk-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async bulkUpdatePrograms(
    @Request() req,
    @Body() updateData: {
      programIds: string[];
      updates: {
        status?: string;
        category?: string;
        archiveReason?: string;
      };
    },
  ) {
    return this.adminService.bulkUpdatePrograms(req.user, updateData.programIds, updateData.updates);
  }

  @Patch('programs/:programId/force-archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async forceArchiveProgram(
    @Request() req,
    @Param('programId') programId: string,
    @Body() data: { reason: string },
  ) {
    await this.adminService.forceArchiveProgram(req.user, programId, data.reason);
    return { message: 'Программа успешно архивирована' };
  }

  // A1.7 Административное управление словарями
  @Get('dictionaries/table')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getDictionariesTable(
    @Request() req,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
    @Query('parentId') parentId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filters = {
      search,
      category,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      parentId,
      sortBy,
      sortOrder,
      page: page ? parseInt(page.toString()) : undefined,
      limit: limit ? parseInt(limit.toString()) : undefined,
    };

    return this.adminService.getAdminDictionariesTable(req.user, filters);
  }

  @Post('dictionaries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createDictionaryItem(
    @Request() req,
    @Body() data: {
      name: string;
      value: string;
      category: string;
      parentId?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    const result = await this.adminService.createDictionaryItem(req.user, data);
    return { 
      message: 'Элемент словаря успешно создан',
      id: result.id 
    };
  }

  @Patch('dictionaries/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateDictionaryItem(
    @Request() req,
    @Param('itemId') itemId: string,
    @Body() data: {
      name?: string;
      value?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    await this.adminService.updateDictionaryItem(req.user, itemId, data);
    return { message: 'Элемент словаря успешно обновлен' };
  }

  @Delete('dictionaries/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteDictionaryItem(
    @Request() req,
    @Param('itemId') itemId: string,
  ) {
    await this.adminService.deleteDictionaryItem(req.user, itemId);
    return { message: 'Элемент словаря успешно удален' };
  }

  @Patch('dictionaries/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async reorderDictionaryItems(
    @Request() req,
    @Body() data: { items: { id: string; sortOrder: number }[] },
  ) {
    await this.adminService.reorderDictionaryItems(req.user, data.items);
    return { message: 'Порядок элементов словаря успешно изменен' };
  }
}
