export enum DictionaryType {
  // Существующие справочники
  WORKPLACE = 'workplace',
  DEPARTMENT = 'department',
  POSITION = 'position',
  ACADEMIC_DEGREE = 'academic_degree',
  SUBJECT = 'subject',
  
  // Новые справочники согласно ТЗ
  INSTITUTIONS = 'institutions', // Справочник учреждений
  SUBDIVISIONS = 'subdivisions', // Справочник подразделений
  LABOR_FUNCTIONS = 'labor_functions', // Справочник трудовых функций
  LABOR_ACTIONS = 'labor_actions', // Справочник трудовых действий
  JOB_RESPONSIBILITIES = 'job_responsibilities', // Справочник должностных обязанностей
  STUDENT_CATEGORIES = 'student_categories', // Справочник категорий слушателей
  EDUCATION_FORMS = 'education_forms', // Справочник форм обучения
  SUBJECTS = 'subjects', // Справочник учебных предметов
  EXPERT_ALGORITHMS = 'expert_algorithms', // Справочник алгоритмов назначения экспертов
  KOIRO_SUBDIVISIONS = 'koiro_subdivisions', // Справочник подразделений КОИРО
  KOIRO_MANAGERS = 'koiro_managers', // Справочник руководителей КОИРО
}

export enum DictionaryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
