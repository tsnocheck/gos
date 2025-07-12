import { IsEmail, IsString, MinLength, IsOptional, IsArray } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  lastName?: string; // Фамилия

  @IsOptional()
  @IsString()
  firstName?: string; // Имя

  @IsOptional()
  @IsString()
  middleName?: string; // Отчество

  @IsOptional()
  @IsString()
  phone?: string; // Телефон

  @IsOptional()
  @IsString()
  position?: string; // Должность

  @IsOptional()
  @IsString()
  workplace?: string; // Место работы

  @IsOptional()
  @IsString()
  department?: string; // Структурное подразделение

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[]; // Преподаваемые предметы

  @IsOptional()
  @IsString()
  academicDegree?: string; // Ученая степень
}
