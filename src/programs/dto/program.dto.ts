import { IsString, IsOptional, IsEnum, IsInt, IsUUID, IsDateString, IsBoolean, IsArray, Min, Max, isArray } from 'class-validator';
import { ProgramStatus, ProgramSection } from '../enums/program.enum';
import { Type } from 'class-transformer';

export class CreateProgramDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  programCode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsString()
  competencies?: string;

  @IsOptional()
  @IsString()
  learningOutcomes?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  methodology?: string;

  @IsOptional()
  @IsString()
  assessment?: string;

  @IsOptional()
  @IsString()
  materials?: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  nprContent?: string;

  @IsOptional()
  @IsString()
  pmrContent?: string;

  @IsOptional()
  @IsString()
  vrContent?: string;
}

export class UpdateProgramDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  programCode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsString()
  competencies?: string;

  @IsOptional()
  @IsString()
  learningOutcomes?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  methodology?: string;

  @IsOptional()
  @IsString()
  assessment?: string;

  @IsOptional()
  @IsString()
  materials?: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  nprContent?: string;

  @IsOptional()
  @IsString()
  pmrContent?: string;

  @IsOptional()
  @IsString()
  vrContent?: string;
}

export class SubmitProgramDto {
  @IsOptional()
  @IsString()
  message?: string; // Сообщение для экспертов
}

export class ApproveProgramDto {
  @IsOptional()
  @IsString()
  comment?: string; // Комментарий при одобрении
}

export class RejectProgramDto {
  @IsString()
  reason: string; // Причина отклонения
}

export class CreateVersionDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  changeDescription?: string; // Описание изменений в новой версии
}

export class ProgramQueryDto {
  @IsOptional()
  @IsArray()
  'status[]'?: ProgramStatus[];

  @IsOptional()
  @IsUUID()
  authorId?: string;

  @IsOptional()
  @IsString()
  search?: string; // Поиск по названию или описанию

  @IsOptional()
  @IsString()
  sortBy?: string; // createdAt, updatedAt, title

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
