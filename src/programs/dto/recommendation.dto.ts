import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsUUID,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import {
  RecommendationType,
  RecommendationStatus,
} from '../entities/recommendation.entity';

export class CreateRecommendationDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(RecommendationType)
  type?: RecommendationType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  priority?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

export class UpdateRecommendationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(RecommendationType)
  type?: RecommendationType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  priority?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsEnum(RecommendationStatus)
  status?: RecommendationStatus;
}

export class RespondToRecommendationDto {
  @IsString()
  authorResponse: string;

  @IsOptional()
  @IsEnum(RecommendationStatus)
  status?: RecommendationStatus;
}

export class ExpertFeedbackDto {
  @IsString()
  expertFeedback: string;

  @IsOptional()
  @IsEnum(RecommendationStatus)
  status?: RecommendationStatus;
}

export class RecommendationQueryDto {
  @IsOptional()
  @IsEnum(RecommendationStatus)
  status?: RecommendationStatus;

  @IsOptional()
  @IsEnum(RecommendationType)
  type?: RecommendationType;

  @IsOptional()
  @IsUUID()
  programId?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsUUID()
  createdById?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  priority?: number;

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
