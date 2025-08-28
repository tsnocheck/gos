export enum ProgramStatus {
  DRAFT = 'draft',           // Черновик
  SUBMITTED = 'submitted',   // Отправлена на экспертизу
  IN_REVIEW = 'in_review',   // На рассмотрении
  NEEDS_REVISION = 'needs_revision', // Требует доработки
  APPROVED = 'approved',     // Одобрена
  REJECTED = 'rejected',     // Отклонена
  ARCHIVED = 'archived',     // В архиве
}

export enum ProgramSection {
  NPR = 'npr',  // Нормативно-правовой раздел
  PMR = 'pmr',  // Предметно-методический раздел
  VR = 'vr',    // Вариативный раздел
}

export enum ExpertiseStatus {
  PENDING = 'pending',       // Ожидает экспертизы
  IN_PROGRESS = 'in_progress', // В процессе экспертизы
  COMPLETED = 'completed',   // Экспертиза завершена
  APPROVED = 'approved',     // Одобрено экспертом
  REJECTED = 'rejected',     // Отклонено экспертом
  NEEDS_REVISION = 'needs_revision', // Отправлено на доработку
}
