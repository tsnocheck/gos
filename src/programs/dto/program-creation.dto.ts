import { 
  IsString, 
  IsOptional, 
  IsInt, 
  IsUUID, 
  IsArray, 
  IsBoolean,
  ValidateNested,
  Min,
  IsEnum,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { 
  Equipment, 
  DistanceEquipment, 
  Abbreviation, 
  Module, 
  Attestation, 
  Topic, 
  NetworkOrg, 
  OrgPedConditions,
  CreateProgramForm 
} from '../types/program-creation.types';

export class AbbreviationDto implements Abbreviation {
  @IsString()
  abbreviation: string;

  @IsString()
  fullname: string;
}

export class ModuleDto implements Module {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  lecture: number;

  @IsInt()
  @Min(0)
  practice: number;

  @IsInt()
  @Min(0)
  distant: number;

  @IsInt()
  @Min(0)
  total: number;

  @IsInt()
  @Min(0)
  kad: number;
}

export class AttestationDto implements Attestation {
  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  lecture: number;

  @IsInt()
  @Min(0)
  practice: number;

  @IsInt()
  @Min(0)
  distant: number;

  @IsString()
  form: string;

  @IsInt()
  @Min(0)
  total: number;
}

export class TopicDto implements Topic {
  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  lecture: number;

  @IsInt()
  @Min(0)
  practice: number;

  @IsInt()
  @Min(0)
  distant: number;
}

export class NetworkOrgDto implements NetworkOrg {
  @IsString()
  org: string;

  @IsString()
  participation: string;

  @IsString()
  form: string;
}

export class OrgPedConditionsDto implements OrgPedConditions {
  @IsOptional()
  @IsString()
  normativeDocuments?: string;

  @IsOptional()
  @IsString()
  mainLiterature?: string;

  @IsOptional()
  @IsString()
  additionalLiterature?: string;

  @IsOptional()
  @IsString()
  electronicMaterials?: string;

  @IsOptional()
  @IsString()
  internetResources?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Equipment, { each: true })
  equipment?: Equipment[];

  @IsOptional()
  @IsString()
  otherEquipment?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(DistanceEquipment, { each: true })
  distanceEquipment?: DistanceEquipment[];

  @IsOptional()
  @IsString()
  otherDistance?: string;

  @IsOptional()
  @IsString()
  personnelProvision?: string;
}

export class CreateProgramFormDto implements CreateProgramForm {
  // Шаг 2: Титульный лист
  @IsOptional()
  @IsString()
  institution?: string;

  @IsOptional()
  @IsString()
  customInstitution?: string;

  @IsString()
  title: string;

  // Шаг 3: Лист согласования
  @IsOptional()
  @IsUUID()
  author1?: string;

  @IsOptional()
  @IsUUID()
  author2?: string;

  // Шаг 4: Список сокращений
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AbbreviationDto)
  abbreviations?: AbbreviationDto[];

  // Шаг 5: Пояснительная записка
  @IsOptional()
  @IsString()
  relevance?: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsString()
  standard?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  functions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  actions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  duties?: string[];

  @IsOptional()
  @IsString()
  know?: string;

  @IsOptional()
  @IsString()
  can?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  educationForm?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  term?: number;

  // Шаг 6: Учебный план
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModuleDto)
  modules?: ModuleDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttestationDto)
  attestations?: AttestationDto[];

  // Шаг 7: Учебно-тематический план
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopicDto)
  topics?: TopicDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NetworkOrgDto)
  network?: NetworkOrgDto[];

  @IsOptional()
  @IsBoolean()
  networkEnabled?: boolean;

  // Шаг 8: Формы аттестации и оценочные материалы
  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  criteria?: string;

  @IsOptional()
  @IsString()
  examples?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  attempts?: number;

  // Шаг 9: Организационно-педагогические условия
  @IsOptional()
  @ValidateNested()
  @Type(() => OrgPedConditionsDto)
  orgPedConditions?: OrgPedConditionsDto;
}

// DTO для получения доступных соавторов
export class GetAvailableCoAuthorsDto {
  @IsOptional()
  @IsString()
  search?: string; // Поиск по имени/email
}

// DTO для назначения экспертов
export class AssignExpertsDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  expertIds: string[]; // Массив ID экспертов (до 3)
}

// DTO для замены экспертов
export class ReplaceExpertsDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  oldExpertIds: string[]; // ID экспертов для замены

  @IsArray()
  @IsUUID(undefined, { each: true })
  newExpertIds: string[]; // ID новых экспертов
}
