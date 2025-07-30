import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dictionary } from './entities/dictionary.entity';
import { CreateDictionaryDto, UpdateDictionaryDto } from './dto/dictionary.dto';
import { DictionaryType, DictionaryStatus } from './enums/dictionary.enum';
import { UserRole } from '../users/enums/user.enum';

@Injectable()
export class DictionariesService {
  constructor(
    @InjectRepository(Dictionary)
    private dictionaryRepository: Repository<Dictionary>,
  ) {}

  // Создание нового значения справочника
  async create(createDictionaryDto: CreateDictionaryDto): Promise<Dictionary> {
    const dictionary = this.dictionaryRepository.create(createDictionaryDto);
    return this.dictionaryRepository.save(dictionary);
  }

  // Получение всех значений справочника по типу
  async findByType(type: string, activeOnly: boolean = true): Promise<Dictionary[]> {
    const query = this.dictionaryRepository.createQueryBuilder('dictionary')
      .where('dictionary.type = :type', { type })
      .orderBy('dictionary.sortOrder', 'ASC')
      .addOrderBy('dictionary.value', 'ASC');

    if (activeOnly) {
      query.andWhere('dictionary.status = :status', { status: DictionaryStatus.ACTIVE });
    }

    return query.getMany();
  }

  // Получение всех типов справочников
  async getAllTypes(): Promise<{ type: string; count: number }[]> {
    const result = await this.dictionaryRepository
      .createQueryBuilder('dictionary')
      .select('dictionary.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('dictionary.status = :status', { status: DictionaryStatus.ACTIVE })
      .groupBy('dictionary.type')
      .getRawMany();

    return result.map(item => ({
      type: item.type,
      count: parseInt(item.count),
    }));
  }

  // Получение всех справочников
  async findAll(): Promise<Dictionary[]> {
    return this.dictionaryRepository.find({
      order: {
        type: 'ASC',
        sortOrder: 'ASC',
        value: 'ASC',
      },
    });
  }

  // Получение справочника по ID
  async findOne(id: string): Promise<Dictionary> {
    const dictionary = await this.dictionaryRepository.findOne({
      where: { id },
    });

    if (!dictionary) {
      throw new NotFoundException(`Dictionary with ID ${id} not found`);
    }

    return dictionary;
  }

  // Обновление справочника
  async update(id: string, updateDictionaryDto: UpdateDictionaryDto): Promise<Dictionary> {
    const dictionary = await this.findOne(id);
    
    Object.assign(dictionary, updateDictionaryDto);
    
    return this.dictionaryRepository.save(dictionary);
  }

  // Удаление справочника (мягкое удаление - смена статуса)
  async remove(id: string): Promise<Dictionary> {
    const dictionary = await this.findOne(id);
    dictionary.status = DictionaryStatus.INACTIVE;
    return this.dictionaryRepository.save(dictionary);
  }

  // Восстановление справочника
  async restore(id: string): Promise<Dictionary> {
    const dictionary = await this.findOne(id);
    dictionary.status = DictionaryStatus.ACTIVE;
    return this.dictionaryRepository.save(dictionary);
  }

  // Инициализация базовых справочников
  async initializeBaseDictionaries(): Promise<void> {
    const baseDictionaries = [
      // Места работы
      { type: DictionaryType.WORKPLACE, value: 'МГУ им. М.В. Ломоносова', sortOrder: 1 },
      { type: DictionaryType.WORKPLACE, value: 'СПбГУ', sortOrder: 2 },
      { type: DictionaryType.WORKPLACE, value: 'НИУ ВШЭ', sortOrder: 3 },
      { type: DictionaryType.WORKPLACE, value: 'МФТИ', sortOrder: 4 },
      { type: DictionaryType.WORKPLACE, value: 'МИФИ', sortOrder: 5 },

      // Подразделения
      { type: DictionaryType.DEPARTMENT, value: 'Физический факультет', sortOrder: 1 },
      { type: DictionaryType.DEPARTMENT, value: 'Математический факультет', sortOrder: 2 },
      { type: DictionaryType.DEPARTMENT, value: 'Химический факультет', sortOrder: 3 },
      { type: DictionaryType.DEPARTMENT, value: 'Биологический факультет', sortOrder: 4 },
      { type: DictionaryType.DEPARTMENT, value: 'Экономический факультет', sortOrder: 5 },

      // Должности
      { type: DictionaryType.POSITION, value: 'Профессор', sortOrder: 1 },
      { type: DictionaryType.POSITION, value: 'Доцент', sortOrder: 2 },
      { type: DictionaryType.POSITION, value: 'Ассистент', sortOrder: 3 },
      { type: DictionaryType.POSITION, value: 'Старший преподаватель', sortOrder: 4 },
      { type: DictionaryType.POSITION, value: 'Преподаватель', sortOrder: 5 },

      // Ученые степени
      { type: DictionaryType.ACADEMIC_DEGREE, value: 'Доктор наук', sortOrder: 1 },
      { type: DictionaryType.ACADEMIC_DEGREE, value: 'Кандидат наук', sortOrder: 2 },
      { type: DictionaryType.ACADEMIC_DEGREE, value: 'PhD', sortOrder: 3 },
      { type: DictionaryType.ACADEMIC_DEGREE, value: 'Магистр', sortOrder: 4 },
      { type: DictionaryType.ACADEMIC_DEGREE, value: 'Бакалавр', sortOrder: 5 },

      // Предметы
      { type: DictionaryType.SUBJECT, value: 'Математика', sortOrder: 1 },
      { type: DictionaryType.SUBJECT, value: 'Физика', sortOrder: 2 },
      { type: DictionaryType.SUBJECT, value: 'Химия', sortOrder: 3 },
      { type: DictionaryType.SUBJECT, value: 'Биология', sortOrder: 4 },
      { type: DictionaryType.SUBJECT, value: 'Информатика', sortOrder: 5 },
      { type: DictionaryType.SUBJECT, value: 'Экономика', sortOrder: 6 },
      { type: DictionaryType.SUBJECT, value: 'История', sortOrder: 7 },
      { type: DictionaryType.SUBJECT, value: 'Философия', sortOrder: 8 },
    ];

    for (const dict of baseDictionaries) {
      const existing = await this.dictionaryRepository.findOne({
        where: { type: dict.type, value: dict.value },
      });

      if (!existing) {
        const dictionary = this.dictionaryRepository.create(dict);
        await this.dictionaryRepository.save(dictionary);
      }
    }
  }

  // 1.7 Заполнение и редактирование справочников системы (только для администраторов)
  async createForAdmin(createDictionaryDto: CreateDictionaryDto, admin: any): Promise<Dictionary> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут создавать справочники');
    }
    return this.create(createDictionaryDto);
  }

  async updateForAdmin(id: string, updateDictionaryDto: UpdateDictionaryDto, admin: any): Promise<Dictionary> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут редактировать справочники');
    }
    return this.update(id, updateDictionaryDto);
  }

  async removeForAdmin(id: string, admin: any): Promise<Dictionary> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут удалять справочники');
    }
    return this.remove(id);
  }

  async restoreForAdmin(id: string, admin: any): Promise<Dictionary> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут восстанавливать справочники');
    }
    return this.restore(id);
  }

  // Массовое создание справочников
  async bulkCreate(dictionariesData: CreateDictionaryDto[], admin: any): Promise<Dictionary[]> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут выполнять массовые операции');
    }

    const dictionaries = dictionariesData.map(data => 
      this.dictionaryRepository.create(data)
    );

    return this.dictionaryRepository.save(dictionaries);
  }

  // Массовое обновление статуса
  async bulkUpdateStatus(ids: string[], status: DictionaryStatus, admin: any): Promise<void> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут выполнять массовые операции');
    }

    await this.dictionaryRepository.update(ids, { status });
  }

  // Получение справочников по фильтрам (для администрирования)
  async findForAdmin(
    type?: DictionaryType, 
    status?: DictionaryStatus,
    search?: string,
    admin?: any
  ): Promise<Dictionary[]> {
    if (admin && !admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут просматривать все справочники');
    }

    const queryBuilder = this.dictionaryRepository.createQueryBuilder('dictionary');

    if (type) {
      queryBuilder.andWhere('dictionary.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('dictionary.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(dictionary.value ILIKE :search OR dictionary.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    return queryBuilder
      .orderBy('dictionary.type', 'ASC')
      .addOrderBy('dictionary.sortOrder', 'ASC')
      .addOrderBy('dictionary.value', 'ASC')
      .getMany();
  }

  // Экспорт справочников для администратора
  async exportDictionaries(type?: DictionaryType, admin?: any): Promise<Dictionary[]> {
    if (admin && !admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут экспортировать справочники');
    }

    const where = type ? { type } : {};
    return this.dictionaryRepository.find({
      where,
      order: {
        type: 'ASC',
        sortOrder: 'ASC',
        value: 'ASC',
      },
    });
  }

  // Получение статистики по справочникам
  async getDictionaryStats(admin: any): Promise<any> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут просматривать статистику');
    }

    const stats = await this.dictionaryRepository
      .createQueryBuilder('dictionary')
      .select('dictionary.type', 'type')
      .addSelect('dictionary.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('dictionary.type')
      .addGroupBy('dictionary.status')
      .getRawMany();

    return stats.map(item => ({
      type: item.type,
      status: item.status,
      count: parseInt(item.count),
    }));
  }

  // Получение связанных элементов справочника (например, трудовые действия для функции)
  async findRelatedItems(parentId: string, childType: DictionaryType): Promise<Dictionary[]> {
    return await this.dictionaryRepository.find({
      where: { 
        parentId, 
        type: childType, 
        status: DictionaryStatus.ACTIVE 
      },
      order: { sortOrder: 'ASC', value: 'ASC' },
    });
  }

  // Получение справочников с учетом иерархии
  async findWithHierarchy(type: DictionaryType): Promise<any[]> {
    const items = await this.findByType(type, true);
    
    // Группируем по родительским элементам если есть parentId
    const itemsWithParent = items.filter(item => item.parentId);
    const rootItems = items.filter(item => !item.parentId);

    if (itemsWithParent.length === 0) {
      return items;
    }

    // Строим иерархическую структуру
    return rootItems.map(parent => ({
      ...parent,
      children: itemsWithParent.filter(child => child.parentId === parent.id)
    }));
  }

  // Инициализация базовых справочников согласно ТЗ
  async initializeSystemDictionaries(): Promise<void> {
    const dictionaries = [
      // Справочник форм обучения
      { type: DictionaryType.EDUCATION_FORMS, value: 'Очная', sortOrder: 1 },
      { type: DictionaryType.EDUCATION_FORMS, value: 'Очная с применением электронного обучения', sortOrder: 2 },
      { type: DictionaryType.EDUCATION_FORMS, value: 'Очно-заочная с применением дистанционных образовательных технологий', sortOrder: 3 },
      { type: DictionaryType.EDUCATION_FORMS, value: 'Очно-заочная с применением дистанционных образовательных технологий и электронного обучения', sortOrder: 4 },
      { type: DictionaryType.EDUCATION_FORMS, value: 'Заочная', sortOrder: 5 },
      { type: DictionaryType.EDUCATION_FORMS, value: 'Заочная с применением дистанционных образовательных технологий', sortOrder: 6 },

      // Справочник алгоритмов назначения экспертов
      { type: DictionaryType.EXPERT_ALGORITHMS, value: 'Алгоритм КОИРО', sortOrder: 1 },
      { type: DictionaryType.EXPERT_ALGORITHMS, value: 'Региональный алгоритм', sortOrder: 2 },

      // Базовые учреждения
      { type: DictionaryType.INSTITUTIONS, value: 'КОИРО', fullName: 'Калининградский областной институт развития образования', sortOrder: 1 },

      // Базовые категории слушателей
      { type: DictionaryType.STUDENT_CATEGORIES, value: 'Учителя', sortOrder: 1 },
      { type: DictionaryType.STUDENT_CATEGORIES, value: 'Директора школ', sortOrder: 2 },
      { type: DictionaryType.STUDENT_CATEGORIES, value: 'Заместители директора', sortOrder: 3 },
      { type: DictionaryType.STUDENT_CATEGORIES, value: 'Педагоги дополнительного образования', sortOrder: 4 },
    ];

    for (const dict of dictionaries) {
      const existing = await this.dictionaryRepository.findOne({
        where: { type: dict.type, value: dict.value }
      });

      if (!existing) {
        await this.dictionaryRepository.save(this.dictionaryRepository.create(dict));
      }
    }

    console.log('✅ Базовые справочники инициализированы');
  }

  // Связывание элементов справочников (например, трудовые действия с функциями)
  async linkDictionaryItems(parentId: string, childIds: string[]): Promise<void> {
    await this.dictionaryRepository.update(
      { id: { $in: childIds } as any },
      { parentId }
    );
  }

  // Отвязывание элементов справочников
  async unlinkDictionaryItems(childIds: string[]): Promise<void> {
    await this.dictionaryRepository.update(
      { id: { $in: childIds } as any },
      { parentId: undefined }
    );
  }

  // Получение полного пути в иерархии
  async getDictionaryPath(id: string): Promise<Dictionary[]> {
    const path: Dictionary[] = [];
    let currentItem = await this.findOne(id);
    
    while (currentItem) {
      path.unshift(currentItem);
      if (currentItem.parentId) {
        currentItem = await this.findOne(currentItem.parentId);
      } else {
        break;
      }
    }
    
    return path;
  }

  // Получение трудовых действий по ID трудовой функции
  async getLaborActionsByFunction(functionId: string): Promise<Dictionary[]> {
    return this.dictionaryRepository.find({
      where: {
        parentId: functionId,
        type: 'labor_actions', // Используем строку вместо enum
        status: DictionaryStatus.ACTIVE,
      },
      order: {
        sortOrder: 'ASC',
        value: 'ASC',
      },
    });
  }

  // Получение трудовых действий по типу функции с использованием формата {id}/labor_actions
  async getLaborActionsByFunctionType(functionId: string): Promise<Dictionary[]> {
    const functionType = `${functionId}/labor_actions`;
    
    return this.dictionaryRepository.find({
      where: {
        type: functionType,
        status: DictionaryStatus.ACTIVE,
      },
      order: {
        sortOrder: 'ASC',
        value: 'ASC',
      },
    });
  }

  // Создание трудового действия, привязанного к функции
  async createLaborAction(createDto: CreateDictionaryDto): Promise<Dictionary> {
    // Если parentId указан, используем обычный способ
    if (createDto.parentId) {
      return this.create({
        ...createDto,
        type: 'labor_actions',
      });
    }

    // Если используется формат типа {functionId}/labor_actions
    if (createDto.type.includes('/labor_actions')) {
      return this.create(createDto);
    }

    throw new Error('Необходимо указать либо parentId, либо тип в формате {functionId}/labor_actions');
  }

  // Получение всех трудовых функций
  async getLaborFunctions(): Promise<Dictionary[]> {
    return this.dictionaryRepository.find({
      where: {
        type: 'labor_functions',
        status: DictionaryStatus.ACTIVE,
      },
      order: {
        sortOrder: 'ASC',
        value: 'ASC',
      },
    });
  }
}
