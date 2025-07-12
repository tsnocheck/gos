export class ExpertiseCriteriaDto {
  // 13 критериев из таблицы № 32
  criterion1: boolean; // Соответствие названия содержанию программы
  criterion1Comment?: string;

  criterion2: boolean; // Актуальность программы 
  criterion2Comment?: string;

  criterion3: boolean; // Соответствие целей и задач
  criterion3Comment?: string;

  criterion4: boolean; // Качество содержания
  criterion4Comment?: string;

  criterion5: boolean; // Методическое обеспечение
  criterion5Comment?: string;

  criterion6: boolean; // Практическая направленность
  criterion6Comment?: string;

  criterion7: boolean; // Инновационность подходов
  criterion7Comment?: string;

  criterion8: boolean; // Структура программы
  criterion8Comment?: string;

  criterion9: boolean; // Компетентностный подход
  criterion9Comment?: string;

  criterion10: boolean; // Оценочные материалы
  criterion10Comment?: string;

  criterion11: boolean; // Кадровое обеспечение
  criterion11Comment?: string;

  criterion12: boolean; // Материально-техническое обеспечение
  criterion12Comment?: string;

  criterion13: boolean; // Информационное обеспечение
  criterion13Comment?: string;

  finalDecision: 'approve' | 'reject'; // Итоговое решение
  generalComment?: string; // Общий комментарий
}
