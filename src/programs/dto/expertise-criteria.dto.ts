import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class Criterion {
  @IsBoolean()
  value: boolean;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  recommendation?: string;
}

export class ExpertiseDto {
  // 1. Характеристика программы
  
  @ValidateNested()
  @Type(() => Criterion)
  criterion1_1: Criterion; // Актуальность разработки и реализации программы

  @ValidateNested()
  @Type(() => Criterion)
  criterion1_2: Criterion; // Цель и тема программы соответствуют друг другу

  @ValidateNested()
  @Type(() => Criterion)
  criterion1_3: Criterion; // Профессиональный стандарт или Единый квалификационный справочник должностей

  @ValidateNested()
  @Type(() => Criterion)
  criterion1_4: Criterion; // Планируемые результаты обучения (в части «знать» и «уметь») соответствуют трудовым действиям

  @ValidateNested()
  @Type(() => Criterion)
  criterion1_5: Criterion; // Планируемые результаты обучения по программе соответствуют теме и цели программы

  // 2. Содержание программы

  @ValidateNested()
  @Type(() => Criterion)
  criterion2_1: Criterion; // Содержание программы соответствует теме программы

  @ValidateNested()
  @Type(() => Criterion)
  criterion2_2: Criterion; // Рабочие программы образовательных модулей соответствуют учебному (тематическому) плану

  @IsOptional()
  @IsString()
  additionalRecommendation?: string; // Дополнительные рекомендации (по желанию эксперта)
}
