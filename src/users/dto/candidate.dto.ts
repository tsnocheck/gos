export class CreateCandidateDto {
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  organization?: string;
  position?: string;
  proposedRoles: string[]; // Предлагаемые роли (author, expert)
  comment?: string;
}

// DTO для регистрации кандидатов пользователями (не админами)
export class RegisterCandidateDto {
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  position?: string;
  workplace?: string;
  department?: string;
  subjects?: string[];
  academicDegree?: string;
}

export class UpdateCandidateDto {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
  organization?: string;
  position?: string;
  proposedRoles?: string[];
  comment?: string;
  status?: string;
}

export class CandidateResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  organization?: string;
  position?: string;
  proposedRoles: string[];
  comment?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  invitedById?: string;
  invitedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}
