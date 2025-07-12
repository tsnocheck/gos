import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AdminController } from './controllers/admin.controller';
import { CandidateController } from './controllers/candidate.controller';
import { AdminService } from './services/admin.service';
import { CandidateService } from './services/candidate.service';
import { EmailService } from './services/email.service';
import { User } from './entities/user.entity';
import { Candidate } from './entities/candidate.entity';
import { Expertise } from '../programs/entities/expertise.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Candidate, Expertise])],
  controllers: [UsersController, AdminController, CandidateController],
  providers: [UsersService, AdminService, CandidateService, EmailService],
  exports: [UsersService, AdminService, CandidateService],
})
export class UsersModule {}
