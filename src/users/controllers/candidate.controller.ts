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
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  // Получение всех кандидатов
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(@Req() req) {
    return this.candidateService.findAll(req.user);
  }

  // 1.1 Добавление кандидата
  @Post()
  async createCandidate(@Body() createCandidateDto: CreateCandidateDto) {
    return this.candidateService.createCandidate(createCandidateDto);
  }

  // Получение статистики кандидатов
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getStats(@Req() req) {
    return this.candidateService.getCandidateStats(req.user);
  }

  // Получение кандидата по ID
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.candidateService.findById(id, req.user);
  }

  // Обновление кандидата
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCandidateDto: UpdateCandidateDto,
    @Req() req,
  ) {
    return this.candidateService.updateCandidate(
      id,
      updateCandidateDto,
      req.user,
    );
  }

  // Отправка приглашения кандидату
  @Post(':id/invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async inviteCandidate(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.candidateService.inviteCandidate(id, req.user);
  }

  // Массовая отправка приглашений
  @Post('invite-multiple')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async inviteMultiple(@Body() body: { candidateIds: string[] }, @Req() req) {
    return this.candidateService.inviteMultipleCandidates(
      body.candidateIds,
      req.user,
    );
  }

  // Отклонение кандидата
  @Put(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async rejectCandidate(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.candidateService.rejectCandidate(id, req.user);
  }

  // Удаление кандидата
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    await this.candidateService.deleteCandidate(id, req.user);
    return { message: 'Кандидат удален' };
  }

  // Одобрение кандидата (создание пользователя)
  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async approveCandidate(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    const result = await this.candidateService.approveCandidate(id, req.user);
    return {
      message: 'Кандидат одобрен, пользователь создан',
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        roles: result.user.roles,
      },
      temporaryPassword: result.password,
    };
  }
}
