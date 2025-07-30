# Документация по расширению функциональности программ

## Обзор изменений

Данный документ описывает реализованные изменения для расширения функциональности создания программ, работы с экспертизами и словарями в системе ГОС.

## 📋 Структура данных для создания программы

### Основные интерфейсы

#### Equipment (Оборудование для аудиторных занятий)
```typescript
export enum Equipment {
  COMPUTER = "computer",           // Компьютер
  PROJECTOR = "projector",         // Проектор
  INTERACTIVE_BOARD = "interactive_board", // Интерактивная доска
  SPEAKERS = "speakers",           // Акустическая система
  MARKER_BOARDS = "marker_boards", // Маркерные доски
  OTHER = "other",                 // Иное
}
```

#### DistanceEquipment (Оборудование для дистанционного обучения)
```typescript
export enum DistanceEquipment {
  PC_INTERNET = "pc-internet",     // ПК с доступом в интернет
  AUDIO_DEVICES = "audio-devices", // Аудиоустройства
  SOFTWARE = "software",           // Программное обеспечение
  OTHER_DISTANCE = "other-distance", // Иное
}
```

#### Abbreviation (Сокращения)
```typescript
export interface Abbreviation {
  abbreviation: string; // Сокращение (например, "КОИРО")
  fullname: string;     // Полная расшифровка
}
```

#### Module (Модуль программы)
```typescript
export interface Module {
  code: string;         // Код модуля
  name: string;         // Название модуля
  lecture: number;      // Часы лекций
  practice: number;     // Часы практики
  distant: number;      // Часы дистанционного обучения
  total: number;        // Всего часов
  kad: number;          // Количество аудиторных дней
}
```

#### Attestation (Аттестация)
```typescript
export interface Attestation {
  name: string;         // Название аттестации
  lecture: number;      // Часы лекций
  practice: number;     // Часы практики
  distant: number;      // Часы дистанционного обучения
  form: string;         // Форма аттестации (экзамен, зачёт)
  total: number;        // Всего часов
}
```

#### Topic (Тема учебно-тематического плана)
```typescript
export interface Topic {
  name: string;         // Название темы
  lecture: number;      // Часы лекций
  practice: number;     // Часы практики
  distant: number;      // Часы дистанционного обучения
}
```

#### NetworkOrg (Сетевая организация)
```typescript
export interface NetworkOrg {
  org: string;          // Наименование организации
  participation: string;// Участие в реализации
  form: string;         // Форма участия
}
```

#### OrgPedConditions (Организационно-педагогические условия)
```typescript
export interface OrgPedConditions {
  normativeDocuments?: string;      // Нормативные документы
  mainLiterature?: string;          // Основная литература
  additionalLiterature?: string;    // Дополнительная литература
  electronicMaterials?: string;     // Электронные учебные материалы
  internetResources?: string;       // Интернет-ресурсы
  equipment?: Equipment[];          // Оборудование для аудиторных занятий
  otherEquipment?: string;          // Иное оборудование
  distanceEquipment?: DistanceEquipment[]; // Оборудование для дистанционного обучения
  otherDistance?: string;           // Иное оборудование для дистанционного обучения
  personnelProvision?: string;      // Кадровое обеспечение
}
```

## 🏗️ Структура формы создания программы

### CreateProgramForm - Главный интерфейс

Интерфейс разделен на 9 шагов создания программы:

#### Шаг 2: Титульный лист
- `institution?: string` - Краткое название выбранного учреждения (например, "КОИРО")
- `customInstitution?: string` - Название учреждения, если выбран вариант "Иное"
- `title: string` - Название программы (обязательное поле)

#### Шаг 3: Лист согласования
- `author1?: string` - ID первого соавтора (пользователь)
- `author2?: string` - ID второго соавтора (пользователь)

#### Шаг 4: Список сокращений
- `abbreviations?: Abbreviation[]` - Массив сокращений

#### Шаг 5: Пояснительная записка
- `relevance?: string` - Актуальность разработки программы
- `goal?: string` - Цель реализации программы
- `standard?: string` - Выбранный стандарт: "professional-standard", "eks" или "both"
- `functions?: string[]` - Трудовые функции (если выбран проф. стандарт)
- `actions?: string[]` - Трудовые действия (если выбран проф. стандарт)
- `duties?: string[]` - Должностные обязанности (если выбран ЕКС)
- `know?: string` - Что должен знать слушатель
- `can?: string` - Что должен уметь слушатель
- `category?: string` - Категория слушателей
- `educationForm?: string` - Форма обучения (очная, заочная и т.д.)
- `term?: number` - Срок освоения программы (часы)

#### Шаг 6: Учебный план
- `modules?: Module[]` - Модули программы (таблица)
- `attestations?: Attestation[]` - Аттестации (таблица)

#### Шаг 7: Учебно-тематический план
- `topics?: Topic[]` - Темы учебно-тематического плана (таблица)
- `network?: NetworkOrg[]` - Организации для сетевой формы (таблица)
- `networkEnabled?: boolean` - Используется ли сетевая форма

#### Шаг 8: Формы аттестации и оценочные материалы
- `requirements?: string` - Описание требований к выполнению
- `criteria?: string` - Критерии оценивания
- `examples?: string` - Примеры заданий
- `attempts?: number` - Количество попыток

#### Шаг 9: Организационно-педагогические условия
- `orgPedConditions?: OrgPedConditions` - Комплексный объект условий

## 🚀 API Endpoints

### Создание программы

#### POST /programs/create-full
Создание программы с полной формой данных.

**Тело запроса:** `CreateProgramFormDto`

**Пример запроса:**
```json
{
  "title": "Программа повышения квалификации",
  "institution": "КОИРО",
  "author1": "uuid-author-1",
  "author2": "uuid-author-2",
  "relevance": "Актуальность программы...",
  "goal": "Цель программы...",
  "standard": "professional-standard",
  "functions": ["function-id-1", "function-id-2"],
  "actions": ["action-id-1", "action-id-2"],
  "term": 72,
  "modules": [
    {
      "code": "М1",
      "name": "Модуль 1",
      "lecture": 10,
      "practice": 8,
      "distant": 6,
      "total": 24,
      "kad": 3
    }
  ]
}
```

### Работа с соавторами

#### GET /programs/co-authors
Получение списка доступных соавторов.

**Параметры запроса:**
- `search?: string` - Поиск по имени/email

**Пример ответа:**
```json
[
  {
    "id": "uuid",
    "firstName": "Иван",
    "lastName": "Иванов",
    "email": "ivanov@example.com",
    "position": "Преподаватель",
    "workplace": "КОИРО"
  }
]
```

### Управление экспертами

#### POST /programs/:id/assign-experts
Назначение экспертов программе (максимум 3).

**Тело запроса:**
```json
{
  "expertIds": ["expert-uuid-1", "expert-uuid-2", "expert-uuid-3"]
}
```

#### PATCH /programs/:id/replace-experts
Замена существующих экспертов.

**Тело запроса:**
```json
{
  "oldExpertIds": ["old-expert-1", "old-expert-2"],
  "newExpertIds": ["new-expert-1", "new-expert-2"]
}
```

### Работа со словарями

#### GET /dictionaries/labor-functions
Получение списка трудовых функций.

#### GET /dictionaries/labor-actions/by-function/:functionId
Получение трудовых действий по ID функции (используя parentId).

#### GET /dictionaries/labor-actions/by-function-type/:functionId
Получение трудовых действий по типу функции (используя формат `{functionId}/labor_actions`).

#### POST /dictionaries/labor-actions
Создание трудового действия с привязкой к функции.

**Тело запроса:**
```json
{
  "type": "uuid-function-123/labor_actions",
  "value": "Проводить анализ образовательных программ",
  "description": "Описание действия",
  "parentId": "uuid-function-123"
}
```

## 📊 Изменения в базе данных

### Таблица programs
Добавлены новые поля:

| Поле | Тип | Описание |
|------|-----|----------|
| author1Id | uuid | ID первого соавтора |
| author2Id | uuid | ID второго соавтора |
| institution | varchar | Учреждение |
| customInstitution | varchar | Кастомное учреждение |
| abbreviations | json | Список сокращений |
| relevance | text | Актуальность |
| goal | text | Цель |
| standard | varchar | Стандарт |
| functions | json | Трудовые функции |
| actions | json | Трудовые действия |
| duties | json | Должностные обязанности |
| know | text | Что должен знать |
| can | text | Что должен уметь |
| category | varchar | Категория слушателей |
| educationForm | varchar | Форма обучения |
| term | int | Срок освоения |
| modules | json | Модули программы |
| attestations | json | Аттестации |
| topics | json | Темы |
| network | json | Сетевые организации |
| networkEnabled | boolean | Сетевая форма |
| criteria | text | Критерии оценивания |
| examples | text | Примеры заданий |
| attempts | int | Количество попыток |
| orgPedConditions | json | Орг-пед условия |

### Таблица dictionaries
Изменения:

| Поле | Старый тип | Новый тип | Описание |
|------|------------|-----------|----------|
| type | enum | varchar | Позволяет динамические типы как `{functionId}/labor_actions` |

## 🔧 Технические детали

### Валидация данных

Все DTO используют `class-validator` для валидации:

```typescript
export class CreateProgramFormDto implements CreateProgramForm {
  @IsString()
  title: string;

  @IsOptional()
  @IsUUID()
  author1?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModuleDto)
  modules?: ModuleDto[];
  
  // ... остальные поля с валидацией
}
```

### Безопасность

- Все операции требуют аутентификации (`JwtAuthGuard`)
- Назначение экспертов доступно только администраторам
- Создание программ доступно авторам и администраторам
- Получение соавторов возвращает только активных пользователей

### Связи в базе данных

```sql
-- Foreign Keys для соавторов
ALTER TABLE programs 
ADD CONSTRAINT FK_programs_author1 
FOREIGN KEY (author1Id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE programs 
ADD CONSTRAINT FK_programs_author2 
FOREIGN KEY (author2Id) REFERENCES users(id) ON DELETE SET NULL;
```

## 📝 Примеры использования

### Создание полной программы

```typescript
const programData: CreateProgramFormDto = {
  title: "Современные методы обучения",
  institution: "КОИРО",
  author1: "uuid-coauthor-1",
  relevance: "В условиях цифровизации образования...",
  goal: "Повышение квалификации педагогов в области...",
  term: 72,
  modules: [
    {
      code: "М1",
      name: "Теоретические основы",
      lecture: 12,
      practice: 8,
      distant: 4,
      total: 24,
      kad: 3
    }
  ],
  orgPedConditions: {
    equipment: [Equipment.COMPUTER, Equipment.PROJECTOR],
    mainLiterature: "Список основной литературы...",
    personnelProvision: "Требования к кадровому обеспечению..."
  }
};

// POST /programs/create-full
const response = await fetch('/programs/create-full', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(programData)
});
```

### Работа с трудовыми действиями

```typescript
// Создание действия с привязкой к функции
const laborAction = {
  type: "uuid-function-123/labor_actions",
  value: "Проводить педагогическую диагностику",
  description: "Анализ образовательных потребностей",
  parentId: "uuid-function-123"
};

// POST /dictionaries/labor-actions
const response = await fetch('/dictionaries/labor-actions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(laborAction)
});
```

## 🔄 Миграция данных

Для применения изменений выполните миграцию:

```bash
npm run migration:run
```

Миграция добавит все необходимые поля и изменит структуру таблиц согласно новым требованиям.

## ⚠️ Важные замечания

1. **Максимум экспертов**: Система поддерживает максимум 3 экспертов на программу
2. **Типы словарей**: Поле `type` теперь строка, что позволяет динамические типы
3. **Соавторы**: Возвращаются только активные пользователи с ролью AUTHOR
4. **Валидация**: Все входные данные проходят строгую валидацию
5. **Связи**: При удалении пользователя связи с программами устанавливаются в NULL

Эта документация описывает полную функциональность расширенного модуля создания программ и управления экспертизами.
