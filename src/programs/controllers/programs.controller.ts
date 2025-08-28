import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { Response } from 'express';
import { ProgramsService } from '../services/programs.service';
import { ExpertAssignmentService } from '../services/expert-assignment.service';
import { ExpertiseService } from '../services/expertise.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user.enum';
import {
  CreateProgramDto,
  UpdateProgramDto,
  SubmitProgramDto,
  ApproveProgramDto,
  RejectProgramDto,
  CreateVersionDto,
  ProgramQueryDto,
} from '../dto/program.dto';
import {
  CreateProgramFormDto,
  AssignExpertsDto,
  ReplaceExpertsDto,
} from '../dto/program-creation.dto';
import { ResubmitAfterRevisionDto } from '../dto/expertise.dto';

@Controller('programs')
@UseGuards(JwtAuthGuard)
export class ProgramsController {
  constructor(
    private readonly programsService: ProgramsService,
    private readonly expertAssignmentService: ExpertAssignmentService,
    private readonly expertiseService: ExpertiseService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() createProgramDto: CreateProgramDto,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return await this.programsService.create(createProgramDto, req.user, file);
  }

  @Get()
  async findAll(@Query() query: ProgramQueryDto, @Request() req) {
    return await this.programsService.findAll(query, req.user);
  }

  @Get('my')
  @UseGuards(RolesGuard)
  @Roles(UserRole.AUTHOR)
  async findMy(@Query() query: ProgramQueryDto, @Request() req) {
    const modifiedQuery = { ...query, authorId: req.user.id };
    return await this.programsService.findAll(modifiedQuery, req.user);
  }

  @Get('statistics')
  async getStatistics(@Request() req) {
    return await this.programsService.getStatistics(req.user);
  }

  @Get('id/:id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return await this.programsService.findOne(id, req.user);
  }

  // Функции для авторов
  @Get(':id/expertise-results')
  @UseGuards(RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  async getExpertiseResults(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return await this.programsService.getExpertiseResults(id, req.user);
  }

  // 2.8 Получение всех версий программы (обновленная версия)
  @Get(':id/versions')
  @UseGuards(JwtAuthGuard)
  async getProgramVersions(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.programsService.getProgramVersions(id, req.user);
  }

  @Get(':id/expertise-status')
  @UseGuards(JwtAuthGuard)
  async getProgramExpertiseStatus(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    // Заглушка - получение статуса экспертизы программы
    return { 
      message: 'Статус экспертизы будет реализован в следующих версиях',
      programId: id 
    };
  }

  @Get('my/grouped')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  async getAuthorProgramsGrouped(@Request() req) {
    // Заглушка - группированные программы автора
    return {
      message: 'Группированный вид программ будет реализован в следующих версиях',
      programs: []
    };
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProgramDto: UpdateProgramDto,
    @Request() req,
  ) {
    return await this.programsService.update(id, updateProgramDto, req.user);
  }

  @Post(':id/submit')
  @UseGuards(RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  async submit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() submitDto: SubmitProgramDto,
    @Request() req,
  ) {
    return await this.programsService.submit(id, submitDto, req.user);
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() approveDto: ApproveProgramDto,
    @Request() req,
  ) {
    return await this.programsService.approve(id, approveDto, req.user);
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() rejectDto: RejectProgramDto,
    @Request() req,
  ) {
    return await this.programsService.reject(id, rejectDto, req.user);
  }

  @Post(':id/archive')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async archive(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return await this.programsService.archive(id, req.user);
  }

  @Post(':id/version')
  @UseGuards(RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  async createVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createVersionDto: CreateVersionDto,
    @Request() req,
  ) {
    return await this.programsService.createVersion(id, createVersionDto, req.user);
  }

  // 2.7 Создание новой версии программы (для авторов после отклонения)
  @Post(':id/new-version')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  async createNewVersion(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.programsService.createNewVersion(id, req.user);
  }

  // Проверка возможности редактирования программы
  @Get(':id/can-edit')
  @UseGuards(JwtAuthGuard)
  async canEditProgram(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const canEdit = await this.programsService.canEditProgram(id, req.user);
    return { canEdit };
  }

  // Административные функции для управления программами
  @Patch(':id/archive')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async archiveProgram(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return await this.programsService.archiveProgram(id, req.user);
  }

  @Patch(':id/unarchive')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async unarchiveProgram(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return await this.programsService.unarchiveProgram(id, req.user);
  }

  @Get('archived')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getArchivedPrograms(@Request() req) {
    return await this.programsService.getArchivedPrograms(req.user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.programsService.remove(id, req.user);
    return { message: 'Программа успешно удалена' };
  }

  @Get(':id/download')
  async downloadFile(@Param('id', ParseUUIDPipe) id: string, @Request() req, @Res() res: Response) {
    return await this.programsService.downloadFile(id, req.user, res);
  }

  // Новые методы для создания программы
  @Post('create-full')
  @UseGuards(RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  async createFullProgram(
    @Body() createProgramFormDto: CreateProgramFormDto,
    @Request() req,
  ) {
    return await this.programsService.createFullProgram(createProgramFormDto, req.user);
  }

  // Назначение экспертов вручную
  @Post(':id/assign-experts')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async assignExperts(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignExpertsDto: AssignExpertsDto,
    @Request() req,
  ) {
    return await this.expertAssignmentService.assignExpertsManually(id, assignExpertsDto, req.user);
  }

  // Замена экспертов
  @Patch(':id/replace-experts')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async replaceExperts(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() replaceExpertsDto: ReplaceExpertsDto,
    @Request() req,
  ) {
    return await this.expertAssignmentService.replaceExperts(id, replaceExpertsDto, req.user);
  }

  // Повторная отправка программы после доработки
  @Post(':id/resubmit-after-revision')
  @UseGuards(RolesGuard)
  @Roles(UserRole.AUTHOR)
  async resubmitAfterRevision(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() resubmitDto: ResubmitAfterRevisionDto,
    @Request() req,
  ) {
    return await this.expertiseService.resubmitAfterRevision(id, resubmitDto, req.user);
  }
}
