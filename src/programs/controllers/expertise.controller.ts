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
  Put,
  Req,
} from '@nestjs/common';
import { ExpertiseService } from '../services/expertise.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user.enum';
import {
  CreateExpertiseDto,
  UpdateExpertiseDto,
  CompleteExpertiseDto,
  AssignExpertDto,
  ExpertiseQueryDto,
} from '../dto/expertise.dto';

@Controller('expertise')
@UseGuards(JwtAuthGuard)
export class ExpertiseController {
  constructor(private readonly expertiseService: ExpertiseService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createExpertiseDto: CreateExpertiseDto, @Request() req) {
    return await this.expertiseService.create(createExpertiseDto, req.user);
  }

  @Get()
  async findAll(@Query() query: ExpertiseQueryDto, @Request() req) {
    return await this.expertiseService.findAll(query, req.user);
  }

  @Get('my')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EXPERT)
  async getMyExpertises(@Query() query: ExpertiseQueryDto, @Request() req) {
    return await this.expertiseService.getMyExpertises(req.user, query);
  }

  @Get('statistics')
  async getStatistics(@Request() req) {
    return await this.expertiseService.getStatistics(req.user);
  }

  // Получение экспертиз для замены (административная функция)
  @Get('for-replacement')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getExpertisesForReplacement(@Req() req) {
    return this.expertiseService.getExpertisesForReplacement(req.user);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return await this.expertiseService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EXPERT, UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateExpertiseDto: UpdateExpertiseDto,
    @Request() req,
  ) {
    return await this.expertiseService.update(id, updateExpertiseDto, req.user);
  }

  @Post(':id/complete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EXPERT)
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() completeDto: CompleteExpertiseDto,
    @Request() req,
  ) {
    return await this.expertiseService.complete(id, completeDto, req.user);
  }

  @Post('programs/:programId/assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async assignExpert(
    @Param('programId', ParseUUIDPipe) programId: string,
    @Body() assignDto: AssignExpertDto,
    @Request() req,
  ) {
    return await this.expertiseService.assignExpert(
      programId,
      assignDto,
      req.user,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.expertiseService.remove(id, req.user);
    return { message: 'Экспертиза успешно удалена' };
  }

  // 3.3 Просмотр и скачивание ДПП ПК, по которым проводилась экспертиза
  @Get('my-programs')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EXPERT, UserRole.ADMIN)
  async getExpertPrograms(@Request() req) {
    return await this.expertiseService.getExpertPrograms(req.user);
  }

  @Get('my-expertises')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EXPERT, UserRole.ADMIN)
  async getMyExpertisesList(@Query('status') status: string, @Request() req) {
    return await this.expertiseService.getExpertExpertises(
      req.user,
      status as any,
    );
  }

  @Get('available-programs')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EXPERT, UserRole.ADMIN)
  async getAvailablePrograms(@Request() req) {
    return await this.expertiseService.getAvailablePrograms(req.user);
  }

  @Patch(':id/start')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EXPERT, UserRole.ADMIN)
  async startExpertise(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return await this.expertiseService.startExpertise(id, req.user);
  }

  // 1.8 Замена эксперта (только для администраторов)
  @Put(':id/replace-expert')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async replaceExpert(
    @Param('id') expertiseId: string,
    @Body() body: { oldExpertId: string; newExpertId: string },
    @Req() req,
  ) {
    return this.expertiseService.replaceExpert(
      expertiseId,
      body.oldExpertId,
      body.newExpertId,
      req.user,
    );
  }

  // Массовая замена эксперта
  @Put('replace-expert-all/:oldExpertId/:newExpertId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async replaceExpertInAllExpertises(
    @Param('oldExpertId') oldExpertId: string,
    @Param('newExpertId') newExpertId: string,
    @Req() req,
  ) {
    const count = await this.expertiseService.replaceExpertInAllExpertises(
      oldExpertId,
      newExpertId,
      req.user,
    );
    return { message: `Эксперт заменен в ${count} экспертизах`, count };
  }

  // 3.2 Создание экспертного заключения по 13 критериям
  @Post(':id/criteria-conclusion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EXPERT)
  async createCriteriaConclusion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() criteriaDto: any, // Используем any пока, т.к. DTO может быть сложной
    @Request() req,
  ) {
    return this.expertiseService.createExpertiseConclusion(
      id,
      criteriaDto,
      req.user,
    );
  }

  // 3.4 Получение всех экспертиз эксперта с фильтрацией
  @Get('expert/my-table')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EXPERT)
  async getExpertTable(@Query() filters: any, @Request() req) {
    return this.expertiseService.getExpertExpertises(req.user, filters);
  }

  // 3.1 Получение PDF программы для эксперта
  @Get('program/:programId/pdf')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EXPERT)
  async getProgramPdf(
    @Param('programId', ParseUUIDPipe) programId: string,
    @Request() req,
  ) {
    try {
      const pdfBuffer = await this.expertiseService.getProgramPdf(
        programId,
        req.user,
      );
      // Возвращаем заглушку пока PDF генерация не реализована
      return { message: 'PDF генерация будет реализована в следующих версиях' };
    } catch (error) {
      return { error: error.message };
    }
  }
}
