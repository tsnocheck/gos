import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { DictionariesService } from './dictionaries.service';
import { CreateDictionaryDto, UpdateDictionaryDto } from './dto/dictionary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user.enum';
import { DictionaryType } from './enums/dictionary.enum';

@Controller('dictionaries')
@UseGuards(JwtAuthGuard)
export class DictionariesController {
  constructor(private readonly dictionariesService: DictionariesService) {}

  // Только администраторы могут создавать справочники
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createDictionaryDto: CreateDictionaryDto) {
    return this.dictionariesService.create(createDictionaryDto);
  }

  // Получение всех типов справочников (доступно всем авторизованным)
  @Get('types')
  getTypes() {
    return this.dictionariesService.getAllTypes();
  }

  // Получение всех справочников (только для админов)
  @Get('all')
  findAll() {
    return this.dictionariesService.findAll();
  }

  // Получение справочника по типу (доступно всем авторизованным)
  @Get('type/:type')
  findByType(
    @Param('type') type: DictionaryType,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const activeOnly = includeInactive !== 'true';
    return this.dictionariesService.findByType(type, activeOnly);
  }

  // Получение справочника по ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dictionariesService.findOne(id);
  }

  // Обновление справочника (только администраторы)
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateDictionaryDto: UpdateDictionaryDto) {
    return this.dictionariesService.update(id, updateDictionaryDto);
  }

  // Удаление справочника (только администраторы)
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.dictionariesService.remove(id);
  }

  // Восстановление справочника (только администраторы)
  @Post(':id/restore')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  restore(@Param('id') id: string) {
    return this.dictionariesService.restore(id);
  }

  // Инициализация базовых справочников (только администраторы)
  @Post('initialize')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async initialize() {
    await this.dictionariesService.initializeBaseDictionaries();
    return { message: 'Base dictionaries initialized successfully' };
  }

  // Административные функции для управления справочниками
  @Post('admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createForAdmin(@Body() createDictionaryDto: CreateDictionaryDto, @Request() req) {
    return this.dictionariesService.createForAdmin(createDictionaryDto, req.user);
  }

  @Patch('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateForAdmin(
    @Param('id') id: string,
    @Body() updateDictionaryDto: UpdateDictionaryDto,
    @Request() req
  ) {
    return this.dictionariesService.updateForAdmin(id, updateDictionaryDto, req.user);
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  removeForAdmin(@Param('id') id: string, @Request() req) {
    return this.dictionariesService.removeForAdmin(id, req.user);
  }

  @Patch('admin/:id/restore')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  restoreForAdmin(@Param('id') id: string, @Request() req) {
    return this.dictionariesService.restoreForAdmin(id, req.user);
  }

  @Post('admin/bulk')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  bulkCreate(@Body() dictionariesData: CreateDictionaryDto[], @Request() req) {
    return this.dictionariesService.bulkCreate(dictionariesData, req.user);
  }

  @Patch('admin/bulk-status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  bulkUpdateStatus(
    @Body() body: { ids: string[]; status: string },
    @Request() req
  ) {
    return this.dictionariesService.bulkUpdateStatus(body.ids, body.status as any, req.user);
  }

  @Get('admin/search')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findForAdmin(
    @Query('type') type: string,
    @Query('status') status: string,
    @Query('search') search: string,
    @Request() req
  ) {
    return this.dictionariesService.findForAdmin(type as any, status as any, search, req.user);
  }

  @Get('admin/export')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  exportDictionaries(@Query('type') type: string, @Request() req) {
    return this.dictionariesService.exportDictionaries(type as any, req.user);
  }

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getDictionaryStats(@Request() req) {
    return this.dictionariesService.getDictionaryStats(req.user);
  }

  // Работа с иерархическими справочниками
  @Get('hierarchy/:type')
  async getDictionaryWithHierarchy(@Param('type') type: string) {
    return await this.dictionariesService.findWithHierarchy(type as any);
  }

  @Get(':parentId/children/:childType')
  async getRelatedItems(
    @Param('parentId') parentId: string,
    @Param('childType') childType: string
  ) {
    return await this.dictionariesService.findRelatedItems(parentId, childType as any);
  }

  @Post('admin/initialize-system')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async initializeSystemDictionaries(@Request() req) {
    if (!req.user.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут инициализировать справочники');
    }
    await this.dictionariesService.initializeSystemDictionaries();
    return { message: 'Системные справочники инициализированы' };
  }

  @Post('admin/link')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async linkDictionaryItems(
    @Body() body: { parentId: string; childIds: string[] },
    @Request() req
  ) {
    if (!req.user.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут связывать элементы справочников');
    }
    await this.dictionariesService.linkDictionaryItems(body.parentId, body.childIds);
    return { message: 'Элементы справочников связаны' };
  }

  @Post('admin/unlink')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async unlinkDictionaryItems(
    @Body() body: { childIds: string[] },
    @Request() req
  ) {
    if (!req.user.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут отвязывать элементы справочников');
    }
    await this.dictionariesService.unlinkDictionaryItems(body.childIds);
    return { message: 'Элементы справочников отвязаны' };
  }

  @Get(':id/path')
  async getDictionaryPath(@Param('id') id: string) {
    return await this.dictionariesService.getDictionaryPath(id);
  }

  // Новые методы для работы с трудовыми функциями и действиями
  @Get('labor-functions')
  async getLaborFunctions() {
    return this.dictionariesService.getLaborFunctions();
  }

  @Get('labor-actions/by-function/:functionId')
  async getLaborActionsByFunction(@Param('functionId') functionId: string) {
    return this.dictionariesService.getLaborActionsByFunction(functionId);
  }

  @Get('labor-actions/by-function-type/:functionId')
  async getLaborActionsByFunctionType(@Param('functionId') functionId: string) {
    return this.dictionariesService.getLaborActionsByFunctionType(functionId);
  }

  @Post('labor-actions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createLaborAction(@Body() createDictionaryDto: CreateDictionaryDto) {
    return this.dictionariesService.createLaborAction(createDictionaryDto);
  }
}
