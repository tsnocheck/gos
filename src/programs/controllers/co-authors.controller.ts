import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user.enum';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../users/entities/user.entity';
import { CoAuthorsService } from '../services/co-authors.service';
import { GetAvailableCoAuthorsDto } from '../dto/program-creation.dto';

@Controller('programs/co-authors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoAuthorsController {
  constructor(private readonly coAuthorsService: CoAuthorsService) {}

  @Get()
  @Roles(UserRole.AUTHOR, UserRole.ADMIN, UserRole.EXPERT)
  async getAvailableCoAuthors(
    @Query() query: GetAvailableCoAuthorsDto,
    @GetUser() user: User,
  ) {
    return this.coAuthorsService.getAvailableCoAuthors(query, user);
  }
}
