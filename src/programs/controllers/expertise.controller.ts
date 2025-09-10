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
  SubmitExpertiseDto,
  AssignExpertDto,
  ExpertiseQueryDto,
  SendForRevisionDto,
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

  @Get('available-programs')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EXPERT, UserRole.ADMIN)
  async getAvailablePrograms(@Request() req) {
    return await this.expertiseService.getAvailablePrograms(req.user);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return await this.expertiseService.findOne(id, req.user);
  }

  @Post(':id/submit')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EXPERT)
  async submit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() submitDto: SubmitExpertiseDto,
    @Request() req,
  ) {
    return await this.expertiseService.submit(id, submitDto, req.user);
  }

  @Post(':id/send-for-revision')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EXPERT)
  async sendForRevision(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() revisionDto: SendForRevisionDto,
    @Request() req,
  ) {
    return await this.expertiseService.sendForRevision(id, revisionDto, req.user);
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
    console.log('Controller replaceExpert called with:', { expertiseId, body, userId: req.user?.id });
    
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

  // Получение экспертиз, отправленных на доработку (для автора)
  @Get('revisions/my')
  @UseGuards(RolesGuard)
  @Roles(UserRole.AUTHOR)
  async getMyRevisions(@Request() req) {
    return await this.expertiseService.getRevisionExpertises(req.user);
  }
}
