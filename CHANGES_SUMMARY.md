# Обновления модуля программ - Краткая сводка

## 🚀 Что реализовано

### ✅ Полноценное создание программ
- **9-шаговая форма создания** программы с детальными данными
- **Валидация всех полей** с использованием class-validator
- **Новый endpoint**: `POST /programs/create-full`

### ✅ Система соавторов  
- **Поиск и выбор соавторов** из активных пользователей
- **До 2 соавторов** на программу
- **Новый endpoint**: `GET /programs/co-authors?search=name`

### ✅ Расширенная система экспертиз
- **До 3 экспертов** вместо 1
- **Ручное назначение** экспертов администратором
- **Замена экспертов** для программ в процессе экспертизы
- **Новые endpoints**:
  - `POST /programs/:id/assign-experts`
  - `PATCH /programs/:id/replace-experts`

### ✅ Улучшенная система словарей
- **Привязка трудовых действий к функциям** через parentId
- **Динамические типы** формата `{functionId}/labor_actions`
- **Поле type изменено** с enum на string для гибкости
- **Новые endpoints**:
  - `GET /dictionaries/labor-functions`
  - `GET /dictionaries/labor-actions/by-function/:id`
  - `POST /dictionaries/labor-actions`

## 📋 Новые поля в Program Entity

| Группа | Поля | Описание |
|--------|------|----------|
| **Соавторы** | `author1Id`, `author2Id` | UUID соавторов |
| **Учреждение** | `institution`, `customInstitution` | Данные об учреждении |
| **Содержание** | `relevance`, `goal`, `know`, `can` | Пояснительная записка |
| **Стандарты** | `standard`, `functions`, `actions`, `duties` | Профстандарты и ЕКС |
| **Обучение** | `category`, `educationForm`, `term` | Параметры обучения |
| **Структура** | `modules`, `attestations`, `topics` | Учебный план |
| **Сеть** | `network`, `networkEnabled` | Сетевая форма |
| **Оценка** | `criteria`, `examples`, `attempts` | Аттестация |
| **Условия** | `orgPedConditions` | Орг-пед условия |
| **Прочее** | `abbreviations` | Сокращения |

## 🔄 Миграция БД

```sql
-- Основные изменения
ALTER TABLE dictionaries ALTER COLUMN type TYPE varchar; -- было enum
ALTER TABLE programs ADD COLUMN author1Id uuid;
ALTER TABLE programs ADD COLUMN author2Id uuid;
-- ... +20 новых полей
```

## 📚 Документация

1. **[PROGRAM_CREATION_DOCUMENTATION.md](./PROGRAM_CREATION_DOCUMENTATION.md)** - Полная документация
2. **[API_EXAMPLES.md](./API_EXAMPLES.md)** - Примеры API запросов
3. **[Исходный код типов](./src/programs/types/program-creation.types.ts)** - TypeScript интерфейсы

## 🎯 Ключевые особенности

### Безопасность
- JWT аутентификация для всех операций
- Роли: только ADMIN может назначать экспертов
- Валидация прав доступа на уровне сервисов

### Гибкость словарей
```typescript
// Старый способ (enum)
type: DictionaryType.LABOR_ACTIONS

// Новый способ (string) 
type: "labor_actions"                    // обычные действия
type: "uuid-func-123/labor_actions"     // действия конкретной функции
```

### Структурированные данные
```typescript
interface CreateProgramForm {
  title: string;                    // Обязательное
  author1?: string;                 // Опционально до 2 соавторов
  modules?: Module[];               // Массив модулей с часами
  orgPedConditions?: OrgPedConditions; // Комплексные условия
  // ... 25+ полей
}
```

## 🧪 Тестирование

### Запуск тестов
```bash
npm run test                    # unit тесты
npm run test:e2e               # интеграционные тесты
```

### Примеры запросов
```bash
# Создание программы
curl -X POST /programs/create-full -d @program-data.json

# Назначение экспертов  
curl -X POST /programs/123/assign-experts -d '{"expertIds":["exp1","exp2"]}'

# Поиск соавторов
curl -X GET "/programs/co-authors?search=Иванов"
```

## ⚡ Быстрый старт

1. **Примените миграцию**:
   ```bash
   npm run migration:run
   ```

2. **Создайте тестовые данные**:
   ```bash
   # Трудовые функции
   curl -X POST /dictionaries -d '{"type":"labor_functions","value":"Обучение"}'
   
   # Трудовые действия
   curl -X POST /dictionaries/labor-actions -d '{"type":"func-123/labor_actions","value":"Планирование уроков","parentId":"func-123"}'
   ```

3. **Создайте программу**:
   ```bash
   curl -X POST /programs/create-full -d '{"title":"Тест программа","term":72}'
   ```

## 🔗 Связанные изменения

- ✅ Обновлен `programs.module.ts`
- ✅ Добавлены новые DTO с валидацией  
- ✅ Расширены сервисы программ и экспертиз
- ✅ Создан сервис соавторов
- ✅ Обновлены контроллеры
- ✅ Добавлена миграция БД

---

**Все изменения обратно совместимы и не ломают существующий функционал!** 🎉
