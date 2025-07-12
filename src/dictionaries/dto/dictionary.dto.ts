import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { DictionaryType, DictionaryStatus } from '../enums/dictionary.enum';

export class CreateDictionaryDto {
  @IsEnum(DictionaryType)
  type: DictionaryType;

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
  @IsEnum(DictionaryStatus)
  status?: DictionaryStatus;
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
  @IsEnum(DictionaryStatus)
  status?: DictionaryStatus;
}
