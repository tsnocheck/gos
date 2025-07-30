import { IsString, IsOptional, IsNumber, Min, IsUUID } from 'class-validator';
import { DictionaryStatus } from '../enums/dictionary.enum';

export class CreateDictionaryDto {
  @IsString()
  type: string; // Изменено с enum на string для поддержки динамических типов

  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  status?: DictionaryStatus;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string; // Для связи трудовых действий с функциями

  @IsOptional()
  metadata?: any;
}

export class UpdateDictionaryDto {
  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  status?: DictionaryStatus;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  metadata?: any;
}
