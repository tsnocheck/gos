import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import {
  RecommendationStatus,
} from '../entities/recommendation.entity';

export class CreateRecommendationDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  type?: string;

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
  @IsString()
  type?: string;

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
  @IsString()
  type?: string;

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
