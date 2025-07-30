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
  total: number;        // Всего часов
  kad: number;          // Количество аудиторных дней
}

export interface Attestation {
  name: string;         // Название аттестации
  lecture: number;      // Часы лекций
  practice: number;     // Часы практики
  distant: number;      // Часы дистанционного обучения
  form: string;         // Форма аттестации (экзамен, зачёт)
  total: number;        // Всего часов
}

export interface Topic {
  name: string;         // Название темы
  lecture: number;      // Часы лекций
  practice: number;     // Часы практики
  distant: number;      // Часы дистанционного обучения
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

export interface CreateProgramForm {
  // Шаг 2: Титульный лист
  institution?: string;         // Краткое название выбранного учреждения (например, "КОИРО")
  customInstitution?: string;   // Название учреждения, если выбран вариант "Иное"
  title: string;                // Название программы

  // Шаг 3: Лист согласования
  author1?: string;             // ID первого соавтора (пользователь)
  author2?: string;             // ID второго соавтора (пользователь)

  // Шаг 4: Список сокращений
  abbreviations?: Abbreviation[]; // Массив сокращений (аббревиатура + расшифровка)

  // Шаг 5: Пояснительная записка
  relevance?: string;           // Актуальность разработки программы
  goal?: string;                // Цель реализации программы
  standard?: string;            // Выбранный стандарт: "professional-standard", "eks" или "both"
  functions?: string[];         // Трудовые функции (если выбран проф. стандарт)
  actions?: string[];           // Трудовые действия (если выбран проф. стандарт)
  duties?: string[];            // Должностные обязанности (если выбран ЕКС)
  know?: string;                // Что должен знать слушатель
  can?: string;                 // Что должен уметь слушатель
  category?: string;            // Категория слушателей
  educationForm?: string;       // Форма обучения (очная, заочная и т.д.)
  term?: number;                // Срок освоения программы (часы)

  // Шаг 6: Учебный план
  modules?: Module[];           // Модули программы (таблица)
  attestations?: Attestation[]; // Аттестации (таблица)

  // Шаг 7: Учебно-тематический план
  topics?: Topic[];             // Темы учебно-тематического плана (таблица)
  network?: NetworkOrg[];       // Организации для сетевой формы (таблица)
  networkEnabled?: boolean;     // Используется ли сетевая форма

  // Шаг 8: Формы аттестации и оценочные материалы
  requirements?: string;        // Описание требований к выполнению
  criteria?: string;            // Критерии оценивания
  examples?: string;            // Примеры заданий
  attempts?: number;            // Количество попыток

  // Шаг 9: Организационно-педагогические условия
  orgPedConditions?: OrgPedConditions;
}
