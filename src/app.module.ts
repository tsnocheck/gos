import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DictionariesModule } from './dictionaries/dictionaries.module';
import { ProgramsModule } from './programs/programs.module';
import { User } from './users/entities/user.entity';
import { Candidate } from './users/entities/candidate.entity';
import { Session } from './auth/entities/session.entity';
import { Dictionary } from './dictionaries/entities/dictionary.entity';
import { Program } from './programs/entities/program.entity';
import { Expertise } from './programs/entities/expertise.entity';
import { Recommendation } from './programs/entities/recommendation.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'postgres'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_NAME', 'postgres'),
        entities: [User, Candidate, Session, Dictionary, Program, Expertise, Recommendation],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    DictionariesModule,
    ProgramsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
