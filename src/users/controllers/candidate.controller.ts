import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CandidateService } from '../services/candidate.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../enums/user.enum';
import { CreateCandidateDto, UpdateCandidateDto } from '../dto/candidate.dto';

@Controller('candidates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  // 1.1 Добавление кандидата
  @Post()
  @Roles(UserRole.ADMIN)
  async createCandidate(@Body() createCandidateDto: CreateCandidateDto, @Req() req) {
    return this.candidateService.createCandidate(createCandidateDto, req.user);
  }

  // Получение всех кандидатов
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(@Req() req) {
    return this.candidateService.findAll(req.user);
  }

  // Получение статистики кандидатов
  @Get('stats')
  @Roles(UserRole.ADMIN)
  async getStats(@Req() req) {
    return this.candidateService.getCandidateStats(req.user);
  }

  // Получение кандидата по ID
  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.candidateService.findById(id, req.user);
  }

  // Обновление кандидата
  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCandidateDto: UpdateCandidateDto,
    @Req() req
  ) {
    return this.candidateService.updateCandidate(id, updateCandidateDto, req.user);
  }

  // Отправка приглашения кандидату
  @Post(':id/invite')
  @Roles(UserRole.ADMIN)
  async inviteCandidate(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.candidateService.inviteCandidate(id, req.user);
  }

  // Массовая отправка приглашений
  @Post('invite-multiple')
  @Roles(UserRole.ADMIN)
  async inviteMultiple(@Body() body: { candidateIds: string[] }, @Req() req) {
    return this.candidateService.inviteMultipleCandidates(body.candidateIds, req.user);
  }

  // Отклонение кандидата
  @Put(':id/reject')
  @Roles(UserRole.ADMIN)
  async rejectCandidate(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.candidateService.rejectCandidate(id, req.user);
  }

  // Удаление кандидата
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    await this.candidateService.deleteCandidate(id, req.user);
    return { message: 'Кандидат удален' };
  }
}
