import { IsEmail, IsString, IsEnum, IsOptional, IsUUID, IsArray } from 'class-validator';
import { UserRole, UserStatus } from '../enums/user.enum';

export class AdminCreateUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];
}

export class AdminUpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  workplace?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString({ each: true })
  subjects?: string[];

  @IsOptional()
  @IsString()
  academicDegree?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class ChangeUserRoleDto {
  @IsUUID()
  userId: string;

  @IsEnum(UserRole)
  role: UserRole;
}

export class ChangeUserStatusDto {
  @IsUUID()
  userId: string;

  @IsEnum(UserStatus)
  status: UserStatus;
}

export class SendInvitationDto {
  @IsUUID()
  userId: string;
}

export class AssignRolesDto {
  @IsUUID()
  userId: string;

  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles: UserRole[];
}

export class AddRoleDto {
  @IsUUID()
  userId: string;

  @IsEnum(UserRole)
  role: UserRole;
}

export class RemoveRoleDto {
  @IsUUID()
  userId: string;

  @IsEnum(UserRole)
  role: UserRole;
}
