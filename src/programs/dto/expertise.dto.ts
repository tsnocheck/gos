import { IsString, IsOptional, IsEnum, IsInt, IsUUID, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { ExpertiseStatus } from '../enums/program.enum';

export class CreateExpertiseDto {
  @IsUUID()
  programId: string;

  @IsUUID()
  expertId: string;

  @IsOptional()
  @IsString()
  initialComments?: string;
}

export class UpdateExpertiseDto {
  @IsOptional()
  @IsString()
  generalFeedback?: string;

  @IsOptional()
  @IsString()
  recommendations?: string;

  @IsOptional()
  @IsString()
  conclusion?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  relevanceScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  contentQualityScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  methodologyScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  practicalValueScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  innovationScore?: number;

  @IsOptional()
  @IsString()
  expertComments?: string;

  @IsOptional()
  @IsBoolean()
  isRecommendedForApproval?: boolean;
}

export class CompleteExpertiseDto {
  @IsString()
  generalFeedback: string;

  @IsString()
  conclusion: string;

  @IsInt()
  @Min(0)
  @Max(10)
  relevanceScore: number;

  @IsInt()
  @Min(0)
  @Max(10)
  contentQualityScore: number;

  @IsInt()
  @Min(0)
  @Max(10)
  methodologyScore: number;

  @IsInt()
  @Min(0)
  @Max(10)
  practicalValueScore: number;

  @IsInt()
  @Min(0)
  @Max(10)
  innovationScore: number;

  @IsBoolean()
  isRecommendedForApproval: boolean;

  @IsOptional()
  @IsString()
  recommendations?: string;

  @IsOptional()
  @IsString()
  expertComments?: string;
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

export class ResubmitAfterRevisionDto {
  @IsString()
  revisionNotes: string; // Заметки автора о внесенных изменениях

  @IsOptional()
  @IsString()
  changesSummary?: string; // Краткое описание изменений
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
