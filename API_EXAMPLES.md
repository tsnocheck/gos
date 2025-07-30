# API Примеры для работы с программами

## 📋 Полные примеры API запросов

### 1. Создание программы с полными данными

```bash
curl -X POST http://localhost:3000/programs/create-full \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Инновационные методы преподавания математики",
    "institution": "КОИРО",
    "customInstitution": null,
    "author1": "123e4567-e89b-12d3-a456-426614174000",
    "author2": "123e4567-e89b-12d3-a456-426614174001",
    "abbreviations": [
      {
        "abbreviation": "КОИРО",
        "fullname": "Калужский областной институт развития образования"
      },
      {
        "abbreviation": "ДПП",
        "fullname": "Дополнительная профессиональная программа"
      }
    ],
    "relevance": "В условиях внедрения новых образовательных стандартов актуальным становится обновление методик преподавания математики.",
    "goal": "Совершенствование профессиональных компетенций педагогов в области современных методов обучения математике.",
    "standard": "professional-standard",
    "functions": [
      "func-123",
      "func-456"
    ],
    "actions": [
      "func-123/labor_actions/action-1",
      "func-123/labor_actions/action-2",
      "func-456/labor_actions/action-3"
    ],
    "know": "Современные методы обучения математике, психологические особенности восприятия математической информации",
    "can": "Применять инновационные технологии в преподавании математики, разрабатывать интерактивные задания",
    "category": "Учителя математики общеобразовательных организаций",
    "educationForm": "Очно-заочная с применением дистанционных образовательных технологий",
    "term": 72,
    "modules": [
      {
        "code": "М1",
        "name": "Теоретические основы современной математической дидактики",
        "lecture": 8,
        "practice": 4,
        "distant": 6,
        "total": 18,
        "kad": 2
      },
      {
        "code": "М2", 
        "name": "Практические аспекты применения инновационных методов",
        "lecture": 6,
        "practice": 12,
        "distant": 8,
        "total": 26,
        "kad": 3
      }
    ],
    "attestations": [
      {
        "name": "Промежуточная аттестация по модулю 1",
        "lecture": 0,
        "practice": 2,
        "distant": 0,
        "form": "Зачет",
        "total": 2
      },
      {
        "name": "Итоговая аттестация",
        "lecture": 0,
        "practice": 4,
        "distant": 0,
        "form": "Защита проекта",
        "total": 4
      }
    ],
    "topics": [
      {
        "name": "Психологические основы обучения математике",
        "lecture": 4,
        "practice": 2,
        "distant": 3
      },
      {
        "name": "Современные образовательные технологии в математике",
        "lecture": 4,
        "practice": 6,
        "distant": 3
      }
    ],
    "networkEnabled": true,
    "network": [
      {
        "org": "ГБОУ КО «Лицей «Технический»",
        "participation": "Проведение практических занятий",
        "form": "Очная"
      }
    ],
    "requirements": "Слушатель должен выполнить итоговый проект, включающий разработку урока с применением инновационных методов",
    "criteria": "Проект оценивается по критериям: новизна подхода (25%), практическая применимость (35%), методическая грамотность (40%)",
    "examples": "Примеры заданий: 1) Разработка интерактивного урока по теме «Квадратные уравнения» 2) Создание системы дифференцированных заданий",
    "attempts": 2,
    "orgPedConditions": {
      "normativeDocuments": "ФЗ «Об образовании в РФ», Профессиональный стандарт «Педагог»",
      "mainLiterature": "1. Иванов И.И. Современная математическая дидактика. М.: Просвещение, 2023. 2. Петров П.П. Инновации в математическом образовании. СПб.: Питер, 2022.",
      "additionalLiterature": "Электронные ресурсы, научные статьи в журналах по математическому образованию",
      "electronicMaterials": "Интерактивные модули на платформе Moodle, видеолекции ведущих методистов",
      "internetResources": "https://edu.ru, https://mathege.ru, https://fipi.ru",
      "equipment": ["computer", "projector", "interactive_board"],
      "otherEquipment": "Графические планшеты для демонстрации геометрических построений",
      "distanceEquipment": ["pc-internet", "software"],
      "otherDistance": "Программное обеспечение GeoGebra, Математический конструктор",
      "personnelProvision": "Преподаватели с ученой степенью в области математического образования, стаж не менее 5 лет"
    }
  }'
```

### 2. Получение доступных соавторов

```bash
# Все доступные соавторы
curl -X GET "http://localhost:3000/programs/co-authors" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Поиск соавторов по имени
curl -X GET "http://localhost:3000/programs/co-authors?search=Иванов" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Ответ:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "firstName": "Иван",
    "lastName": "Иванов", 
    "email": "ivanov@koiro.ru",
    "position": "Преподаватель математики",
    "workplace": "КОИРО"
  },
  {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "firstName": "Мария",
    "lastName": "Петрова",
    "email": "petrova@koiro.ru",
    "position": "Методист",
    "workplace": "КОИРО"
  }
]
```

### 3. Назначение экспертов программе

```bash
curl -X POST "http://localhost:3000/programs/program-uuid-123/assign-experts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "expertIds": [
      "expert-uuid-1",
      "expert-uuid-2", 
      "expert-uuid-3"
    ]
  }'
```

### 4. Замена экспертов

```bash
curl -X PATCH "http://localhost:3000/programs/program-uuid-123/replace-experts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "oldExpertIds": ["expert-uuid-1", "expert-uuid-2"],
    "newExpertIds": ["expert-uuid-4", "expert-uuid-5"]
  }'
```

### 5. Работа со словарями

#### Получение трудовых функций
```bash
curl -X GET "http://localhost:3000/dictionaries/labor-functions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Ответ:**
```json
[
  {
    "id": "func-123",
    "type": "labor_functions",
    "value": "Общепедагогическая функция. Обучение",
    "description": "Осуществление профессиональной деятельности в соответствии с требованиями ФГОС",
    "sortOrder": 1,
    "status": "active"
  }
]
```

#### Получение трудовых действий по функции
```bash
# По parentId
curl -X GET "http://localhost:3000/dictionaries/labor-actions/by-function/func-123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# По типу функции
curl -X GET "http://localhost:3000/dictionaries/labor-actions/by-function-type/func-123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Ответ:**
```json
[
  {
    "id": "action-1",
    "type": "func-123/labor_actions",
    "value": "Разработка и реализация программ учебных дисциплин",
    "parentId": "func-123",
    "status": "active"
  },
  {
    "id": "action-2", 
    "type": "func-123/labor_actions",
    "value": "Планирование и проведение учебных занятий",
    "parentId": "func-123",
    "status": "active"
  }
]
```

#### Создание трудового действия с привязкой
```bash
curl -X POST "http://localhost:3000/dictionaries/labor-actions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "func-123/labor_actions",
    "value": "Формирование навыков, связанных с информационно-коммуникационными технологиями",
    "description": "Применение современных ИКТ в образовательном процессе",
    "parentId": "func-123",
    "sortOrder": 10
  }'
```

## 🔍 Типы словарей

### Существующие типы
- `labor_functions` - Трудовые функции
- `labor_actions` - Трудовые действия  
- `institutions` - Учреждения
- `student_categories` - Категории слушателей
- `education_forms` - Формы обучения
- `job_responsibilities` - Должностные обязанности

### Динамические типы для трудовых действий
- `{functionId}/labor_actions` - где `functionId` это UUID трудовой функции

## 📊 Примеры ответов API

### Успешное создание программы
```json
{
  "id": "program-uuid-123",
  "title": "Инновационные методы преподавания математики",
  "status": "draft",
  "authorId": "author-uuid",
  "author1Id": "123e4567-e89b-12d3-a456-426614174000",
  "author2Id": "123e4567-e89b-12d3-a456-426614174001",
  "institution": "КОИРО",
  "term": 72,
  "createdAt": "2025-07-30T10:00:00.000Z",
  "updatedAt": "2025-07-30T10:00:00.000Z",
  "author": {
    "id": "author-uuid",
    "firstName": "Анна",
    "lastName": "Смирнова",
    "email": "smirnova@koiro.ru"
  },
  "author1": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "firstName": "Иван",
    "lastName": "Иванов"
  },
  "author2": {
    "id": "123e4567-e89b-12d3-a456-426614174001", 
    "firstName": "Мария",
    "lastName": "Петрова"
  }
}
```

### Ошибки валидации
```json
{
  "statusCode": 400,
  "message": [
    "title should not be empty",
    "term must be a positive number"
  ],
  "error": "Bad Request"
}
```

### Ошибка доступа
```json
{
  "statusCode": 403,
  "message": "Только администраторы могут назначать экспертов",
  "error": "Forbidden"
}
```

## 🔐 Авторизация

Все запросы требуют JWT токен в заголовке:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🎯 Роли и права доступа

| Операция | AUTHOR | EXPERT | ADMIN |
|----------|--------|--------|-------|
| Создание программы | ✅ | ❌ | ✅ |
| Получение соавторов | ✅ | ❌ | ✅ |
| Назначение экспертов | ❌ | ❌ | ✅ |
| Замена экспертов | ❌ | ❌ | ✅ |
| Создание словарей | ❌ | ❌ | ✅ |
| Просмотр словарей | ✅ | ✅ | ✅ |

## 📝 Заметки по использованию

1. **Валидация данных**: Все поля проходят строгую валидацию на стороне сервера
2. **Лимиты**: Максимум 3 эксперта на программу
3. **Статусы**: Программа создается в статусе "draft"
4. **Соавторы**: Можно указать до 2 соавторов
5. **Словари**: Поддерживается иерархическая структура через parentId
