export enum Equipment {
  COMPUTER = "computer",
  PROJECTOR = "projector",
  INTERACTIVE_BOARD = "interactive_board",
  SPEAKERS = "speakers",
  MARKER_BOARDS = "marker_boards",
  OTHER = "other",
}

export enum DistanceEquipment {
  PC_INTERNET = "pc-internet",
  AUDIO_DEVICES = "audio-devices",
  SOFTWARE = "software",
  OTHER_DISTANCE = "other-distance",
}

/** Раздел программы */
export enum ProgramSection {
  /** Нормативно-правовой раздел */
  NPR = "npr",
  /** Предметно-методический раздел */
  PMR = "pmr",
  /** Вариативный раздел */
  VR = "vr",
}

export interface Abbreviation {
  abbreviation: string; // Сокращение (например, "КОИРО")
  fullname: string;     // Полная расшифровка
}

export interface Module {
  code: string;         // Код модуля
  name: string;         // Название модуля
  lecture: number;      // Часы лекций
  practice: number;     // Часы практики
  distant: number;      // Часы дистанционного обучения
  kad: number;          // Количество аудиторных дней
  section: ProgramSection; // Раздел программы

  // Шаг 7: Учебно-тематический план
  topics?: Topic[];     // Темы учебно-тематического плана (таблица)
  network?: NetworkOrg[]; // Организации для сетевой формы (таблица)
  networkEnabled?: boolean; // Используется ли сетевая форма
}

export interface Attestation {
  moduleCode?: string;  // Код модуля
  name: string;         // Название аттестации
  lecture: number;      // Часы лекций
  practice: number;     // Часы практики
  distant: number;      // Часы дистанционного обучения
  form: string;         // Форма аттестации

  /** НОВОЕ!!! */
  requirements?: string; // Описание требований к выполнению
  criteria?: string;     // Критерии оценивания
  examples?: string;     // Примеры заданий
  attempts?: number;     // Количество попыток
}

/** НОВОЕ!!! */
export interface EducationModuleTopic {
  topicName: string;
  content: string[];    // Содержание практического занятия
  forms: string[];      // Формы организации практического занятия
  hours: number;        // Кол-во часов
}

export interface EducationModule {
  name: string;
  topics: EducationModuleTopic[];
}

export interface TopicContent {
  content: string[];    // Содержание занятия
  forms: string[];      // Формы организации занятия
  hours: number;        // Количество часов
}

export interface Topic {
  name: string;         // Название темы
  lecture?: TopicContent; // Содержание лекций
  practice?: TopicContent; // Содержание практики
  distant?: TopicContent; // Содержание дистанционного обучения
}

export interface NetworkOrg {
  org: string;          // Наименование организации
  participation: string;// Участие в реализации
  form: string;         // Форма участия
}

export interface OrgPedConditions {
  normativeDocuments?: string;      // Нормативные документы
  mainLiterature?: string;          // Основная литература
  additionalLiterature?: string;    // Дополнительная литература
  electronicMaterials?: string;     // Электронные учебные материалы
  internetResources?: string;       // Интернет-ресурсы
  equipment?: Equipment[];             // Оборудование для аудиторных занятий (чекбоксы)
  otherEquipment?: string;          // Иное оборудование (текст)
  distanceEquipment?: DistanceEquipment[];     // Оборудование для дистанционного обучения (чекбоксы)
  otherDistance?: string;           // Иное оборудование для дистанционного обучения (текст)
  personnelProvision?: string;      // Кадровое обеспечение
}

/** Стандарт */
export enum Standard {
  /** Профессиональный стандарт */
  PROFESSIONAL_STANDARD = "professional-standard",
  /** ЕКС */
  EKS = "eks",
  /** Оба стандарта */
  BOTH = "both",
}

export interface CreateProgramForm {
  // Шаг 2: Титульный лист
  institution?: string;         // Краткое название выбранного учреждения (например, "КОИРО")
  customInstitution?: string;   // Название учреждения, если выбран вариант "Иное"
  title: string;                // Название программы

  // Автор программы
  author?: any;                 // Автор программы (User)

  // Шаг 3: Лист согласования
  coAuthorIds: string[];        // ID соавторов (пользователи)

  // Шаг 4: Список сокращений
  abbreviations?: Abbreviation[]; // Массив сокращений (аббревиатура + расшифровка)

  // Шаг 5: Пояснительная записка
  relevance?: string;           // Актуальность разработки программы
  goal?: string;                // Цель реализации программы
  standard?: Standard;          // Выбранный стандарт: "professional-standard", "eks" или "both"
  functions?: string[];         // Трудовые функции (если выбран проф. стандарт)
  actions?: string[];           // Трудовые действия (если выбран проф. стандарт)
  duties?: string[];            // Должностные обязанности (если выбран ЕКС)
  know?: string[];              // Что должен знать слушатель
  can?: string[];               // Что должен уметь слушатель
  category?: string;            // Категория слушателей
  educationForm?: string;       // Форма обучения (очная, заочная и т.д.)
  term?: number;                // Срок освоения программы (часы)

  // Шаг 6: Учебный план
  modules?: Module[];           // Модули программы (таблица)
  attestations?: Attestation[]; // Аттестации (таблица)

  // Шаг 9: Организационно-педагогические условия
  orgPedConditions: OrgPedConditions;
}
