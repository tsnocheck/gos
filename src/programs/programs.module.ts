import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Program } from './entities/program.entity';
import { Expertise } from './entities/expertise.entity';
import { Recommendation } from './entities/recommendation.entity';
import { User } from '../users/entities/user.entity';
import { ProgramsService } from './services/programs.service';
import { ExpertiseService } from './services/expertise.service';
import { RecommendationsService } from './services/recommendations.service';
import { ExpertAssignmentService } from './services/expert-assignment.service';
import { ProgramsController } from './controllers/programs.controller';
import { ExpertiseController } from './controllers/expertise.controller';
import { RecommendationsController } from './controllers/recommendations.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Program, Expertise, Recommendation, User]),
    UsersModule,
  ],
  controllers: [
    ProgramsController,
    ExpertiseController,
    RecommendationsController,
  ],
  providers: [
    ProgramsService,
    ExpertiseService,
    RecommendationsService,
    ExpertAssignmentService,
  ],
  exports: [
    ProgramsService,
    ExpertiseService,
    RecommendationsService,
    ExpertAssignmentService,
  ],
})
export class ProgramsModule {}
