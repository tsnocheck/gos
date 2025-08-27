import { UserRole, UserStatus } from '../enums/user.enum';

export interface UserResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  roles: UserRole[];
  status: UserStatus;
  academicDegree?: string;
  workplace?: string;
  department?: string;
  position?: string;
  phone?: string;
  subjects?: string[];
  invitationExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUserResponse {
  id: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  roles: UserRole[];
  academicDegree?: string;
  workplace?: string;
  department?: string;
  position?: string;
}
