import { IsString, IsOptional, IsEnum, IsInt, IsUUID, IsBoolean, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ExpertiseStatus } from '../enums/program.enum';
import { Criterion } from './expertise-criteria.dto';

export class CreateExpertiseDto {
  @IsUUID()
  programId: string;

  @IsUUID()
  expertId: string;

  @IsOptional()
  @IsString()
  initialComments?: string;
}

export class SubmitExpertiseDto {
  // 1. Характеристика программы
  @ValidateNested()
  @Type(() => Criterion)
  criterion1_1: Criterion; // Актуальность разработки и реализации программы

  @ValidateNested()
  @Type(() => Criterion)
  criterion1_2: Criterion; // Цель и тема программы соответствуют друг другу

  @ValidateNested()
  @Type(() => Criterion)
  criterion1_3: Criterion; // Профессиональный стандарт

  @ValidateNested()
  @Type(() => Criterion)
  criterion1_4: Criterion; // Планируемые результаты обучения (знать/уметь)

  @ValidateNested()
  @Type(() => Criterion)
  criterion1_5: Criterion; // Планируемые результаты обучения по программе

  // 2. Содержание программы
  @ValidateNested()
  @Type(() => Criterion)
  criterion2_1: Criterion; // Содержание программы соответствует теме

  @ValidateNested()
  @Type(() => Criterion)
  criterion2_2: Criterion; // Рабочие программы образовательных модулей

  @IsOptional()
  @IsString()
  additionalRecommendation?: string; // Дополнительные рекомендации

  @IsOptional()
  @IsString()
  generalFeedback?: string; // Общий отзыв эксперта

  @IsOptional()
  @IsString()
  conclusion?: string; // Заключение
}

export class SendForRevisionDto {
  @IsString()
  revisionComments: string; // Комментарии с замечаниями для доработки

  @IsOptional()
  @IsString()
  generalFeedback?: string; // Общий отзыв эксперта

  @IsOptional()
  @IsString()
  recommendations?: string; // Рекомендации по улучшению
}

export class AssignExpertDto {
  @IsUUID()
  expertId: string;

  @IsOptional()
  @IsString()
  assignmentMessage?: string;
}

export class ExpertiseQueryDto {
  @IsOptional()
  @IsEnum(ExpertiseStatus)
  status?: ExpertiseStatus;

  @IsOptional()
  @IsUUID()
  expertId?: string;

  @IsOptional()
  @IsUUID()
  programId?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
