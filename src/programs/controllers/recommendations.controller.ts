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
} from '@nestjs/common';
import { RecommendationsService } from '../services/recommendations.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user.enum';
import {
  CreateRecommendationDto,
  UpdateRecommendationDto,
  RespondToRecommendationDto,
  ExpertFeedbackDto,
  RecommendationQueryDto,
} from '../dto/recommendation.dto';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EXPERT)
  async create(@Body() createRecommendationDto: CreateRecommendationDto, @Request() req) {
    return await this.recommendationsService.create(createRecommendationDto, req.user);
  }

  @Get()
  async findAll(@Query() query: RecommendationQueryDto, @Request() req) {
    return await this.recommendationsService.findAll(query, req.user);
  }

  @Get('my')
  async getMyRecommendations(@Query() query: RecommendationQueryDto, @Request() req) {
    return await this.recommendationsService.getMyRecommendations(req.user, query);
  }

  @Get('programs/:programId')
  async getProgramRecommendations(
    @Param('programId', ParseUUIDPipe) programId: string,
    @Request() req,
  ) {
    return await this.recommendationsService.getProgramRecommendations(programId, req.user);
  }

  @Get('statistics')
  async getStatistics(@Request() req) {
    return await this.recommendationsService.getStatistics(req.user);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return await this.recommendationsService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EXPERT)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRecommendationDto: UpdateRecommendationDto,
    @Request() req,
  ) {
    return await this.recommendationsService.update(id, updateRecommendationDto, req.user);
  }

  @Post(':id/respond')
  @UseGuards(RolesGuard)
  @Roles(UserRole.AUTHOR)
  async respond(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() respondDto: RespondToRecommendationDto,
    @Request() req,
  ) {
    return await this.recommendationsService.respond(id, respondDto, req.user);
  }

  @Post(':id/feedback')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EXPERT, UserRole.ADMIN)
  async provideFeedback(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() feedbackDto: ExpertFeedbackDto,
    @Request() req,
  ) {
    return await this.recommendationsService.provideFeedback(id, feedbackDto, req.user);
  }

  @Post(':id/archive')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EXPERT)
  async archive(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return await this.recommendationsService.archive(id, req.user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.recommendationsService.remove(id, req.user);
    return { message: 'Рекомендация успешно удалена' };
  }

  // Административные функции для системных рекомендаций
  @Post('system')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createSystemRecommendation(@Body() createDto: CreateRecommendationDto, @Request() req) {
    return await this.recommendationsService.createSystemRecommendation(createDto, req.user);
  }

  @Patch('system/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateSystemRecommendation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateRecommendationDto,
    @Request() req
  ) {
    return await this.recommendationsService.updateSystemRecommendation(id, updateDto, req.user);
  }

  @Delete('system/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteSystemRecommendation(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.recommendationsService.deleteSystemRecommendation(id, req.user);
    return { message: 'Системная рекомендация удалена' };
  }

  @Get('system')
  async getSystemRecommendations(@Query('type') type: string) {
    return await this.recommendationsService.getSystemRecommendations(type);
  }

  @Get('step/:step')
  async getRecommendationsForStep(
    @Param('step') step: string,
    @Query('programType') programType: string
  ) {
    return await this.recommendationsService.getRecommendationsForStep(step, programType);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllRecommendationsForAdmin(@Request() req) {
    return await this.recommendationsService.getAllRecommendationsForAdmin(req.user);
  }

  @Patch('admin/bulk-status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async bulkUpdateStatus(
    @Body() body: { ids: string[]; status: string },
    @Request() req
  ) {
    await this.recommendationsService.bulkUpdateStatus(body.ids, body.status as any, req.user);
    return { message: 'Статусы обновлены' };
  }
}
