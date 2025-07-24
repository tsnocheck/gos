import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Recommendation,
  RecommendationStatus,
} from '../entities/recommendation.entity';
import { Program } from '../entities/program.entity';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user.enum';
import {
  CreateRecommendationDto,
  UpdateRecommendationDto,
  RespondToRecommendationDto,
  ExpertFeedbackDto,
  RecommendationQueryDto,
} from '../dto/recommendation.dto';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(Recommendation)
    private readonly recommendationRepository: Repository<Recommendation>,
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
  ) {}

  private hasRole(user: User, role: UserRole): boolean {
    return (
      user &&
      user.roles &&
      Array.isArray(user.roles) &&
      user.roles.includes(role)
    );
  }

  private hasAnyRole(user: User, roles: UserRole[]): boolean {
    return (
      user &&
      user.roles &&
      Array.isArray(user.roles) &&
      roles.some((role) => user.roles.includes(role))
    );
  }

  private isOnlyAuthor(user: User): boolean {
    return (
      this.hasRole(user, UserRole.AUTHOR) &&
      !this.hasRole(user, UserRole.ADMIN) &&
      !this.hasRole(user, UserRole.EXPERT)
    );
  }

  async create(
    createRecommendationDto: CreateRecommendationDto,
    creator: User,
  ): Promise<Recommendation> {
    // Проверка прав создания рекомендаций
    if (!this.hasAnyRole(creator, [UserRole.ADMIN, UserRole.EXPERT])) {
      throw new ForbiddenException(
        'Только администраторы и эксперты могут создавать рекомендации',
      );
    }

    /** Todo: Fix it. Commented because program isn't required for create recommendation */
    // const program = await this.programRepository.findOne({
    //   where: { id: createRecommendationDto.programId },
    //   relations: ['author'],
    // });

    // if (!program) {
    //   throw new NotFoundException('Программа не найдена');
    // }

    const recommendation = this.recommendationRepository.create({
      ...createRecommendationDto,
      createdById: creator.id,
      assignedToId: createRecommendationDto.assignedToId,
    });

    return await this.recommendationRepository.save(recommendation);
  }

  async findAll(
    query: RecommendationQueryDto,
    user: User,
  ): Promise<{ data: Recommendation[]; total: number }> {
    const {
      status,
      type,
      programId,
      assignedToId,
      createdById,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
    } = query;

    const queryBuilder = this.recommendationRepository
      .createQueryBuilder('recommendation')
      .leftJoinAndSelect('recommendation.program', 'program')
      .leftJoinAndSelect('recommendation.createdBy', 'createdBy')
      .leftJoinAndSelect('recommendation.assignedTo', 'assignedTo')
      .leftJoinAndSelect('program.author', 'author');

    // Фильтрация для авторов - только назначенные им рекомендации
    if (this.isOnlyAuthor(user)) {
      queryBuilder.andWhere('recommendation.assignedToId = :userId', {
        userId: user.id,
      });
    }

    // Фильтрация для экспертов - только созданные ими рекомендации или по их программам
    if (this.hasRole(user, UserRole.EXPERT)) {
      const subQuery = queryBuilder
        .subQuery()
        .select('1')
        .from('expertises', 'e')
        .where('e."programId" = recommendation."programId"')
        .andWhere('e."expertId" = :userId')
        .getQuery();

      queryBuilder.andWhere(
        `(recommendation.createdById = :userId OR EXISTS ${subQuery})`,
        { userId: user.id },
      );
    }
    // Фильтрация по статусу
    if (status) {
      queryBuilder.andWhere('recommendation.status = :status', { status });
    }

    // Фильтрация по типу
    if (type) {
      queryBuilder.andWhere('recommendation.type = :type', { type });
    }

    // Фильтрация по программе
    if (programId) {
      queryBuilder.andWhere('recommendation.programId = :programId', {
        programId,
      });
    }

    // Фильтрация по назначенному пользователю
    if (assignedToId) {
      queryBuilder.andWhere('recommendation.assignedToId = :assignedToId', {
        assignedToId,
      });
    }

    // Фильтрация по создателю
    if (createdById) {
      queryBuilder.andWhere('recommendation.createdById = :createdById', {
        createdById,
      });
    }

    // Фильтрация по приоритету
    if (priority) {
      queryBuilder.andWhere('recommendation.priority = :priority', {
        priority,
      });
    }

    // Сортировка
    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'dueDate',
      'priority',
      'title',
    ];
    if (allowedSortFields.includes(sortBy)) {
      queryBuilder.orderBy(`recommendation.${sortBy}`, sortOrder);
    }

    // Пагинация
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async findOne(id: string, user: User): Promise<Recommendation> {
    const recommendation = await this.recommendationRepository.findOne({
      where: { id },
      relations: ['program', 'program.author', 'createdBy', 'assignedTo'],
    });

    if (!recommendation) {
      throw new NotFoundException('Рекомендация не найдена');
    }

    // Проверка доступа
    this.checkAccess(recommendation, user);

    return recommendation;
  }

  async update(
    id: string,
    updateRecommendationDto: UpdateRecommendationDto,
    user: User,
  ): Promise<Recommendation> {
    const recommendation = await this.findOne(id, user);

    // Только создатель или админ могут обновлять рекомендацию
    if (
      !this.hasRole(user, UserRole.ADMIN) &&
      recommendation.createdById !== user.id
    ) {
      throw new ForbiddenException(
        'Нет доступа к редактированию этой рекомендации',
      );
    }

    Object.assign(recommendation, updateRecommendationDto);
    return await this.recommendationRepository.save(recommendation);
  }

  async respond(
    id: string,
    respondDto: RespondToRecommendationDto,
    author: User,
  ): Promise<Recommendation> {
    const recommendation = await this.findOne(id, author);

    // Только назначенный пользователь может отвечать на рекомендацию
    if (recommendation.assignedToId !== author.id) {
      throw new ForbiddenException('Нет доступа к ответу на эту рекомендацию');
    }

    recommendation.authorResponse = respondDto.authorResponse;

    if (respondDto.status) {
      recommendation.status = respondDto.status;
    }

    if (respondDto.status === RecommendationStatus.RESOLVED) {
      recommendation.resolvedAt = new Date();
    }

    return await this.recommendationRepository.save(recommendation);
  }

  async provideFeedback(
    id: string,
    feedbackDto: ExpertFeedbackDto,
    expert: User,
  ): Promise<Recommendation> {
    const recommendation = await this.findOne(id, expert);

    // Только создатель рекомендации (эксперт) или админ могут давать обратную связь
    if (
      !this.hasRole(expert, UserRole.ADMIN) &&
      recommendation.createdById !== expert.id
    ) {
      throw new ForbiddenException(
        'Нет доступа к предоставлению обратной связи на эту рекомендацию',
      );
    }

    recommendation.expertFeedback = feedbackDto.expertFeedback;

    if (feedbackDto.status) {
      recommendation.status = feedbackDto.status;
    }

    return await this.recommendationRepository.save(recommendation);
  }

  async getMyRecommendations(
    user: User,
    query: RecommendationQueryDto,
  ): Promise<{ data: Recommendation[]; total: number }> {
    const filterQuery = { ...query };

    if (this.isOnlyAuthor(user)) {
      filterQuery.assignedToId = user.id;
    } else if (this.hasRole(user, UserRole.EXPERT)) {
      filterQuery.createdById = user.id;
    }

    return await this.findAll(filterQuery, user);
  }

  async getProgramRecommendations(
    programId: string,
    user: User,
  ): Promise<Recommendation[]> {
    const program = await this.programRepository.findOne({
      where: { id: programId },
      relations: ['author'],
    });

    if (!program) {
      throw new NotFoundException('Программа не найдена');
    }

    // Проверка доступа к программе
    if (this.isOnlyAuthor(user) && program.authorId !== user.id) {
      throw new ForbiddenException(
        'Нет доступа к рекомендациям этой программы',
      );
    }

    return await this.recommendationRepository.find({
      where: { programId },
      relations: ['createdBy', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });
  }

  async archive(id: string, user: User): Promise<Recommendation> {
    const recommendation = await this.findOne(id, user);

    // Только админ или создатель могут архивировать
    if (
      !this.hasRole(user, UserRole.ADMIN) &&
      recommendation.createdById !== user.id
    ) {
      throw new ForbiddenException(
        'Нет доступа к архивированию этой рекомендации',
      );
    }

    recommendation.status = RecommendationStatus.ARCHIVED;
    return await this.recommendationRepository.save(recommendation);
  }

  async remove(id: string, admin: User): Promise<void> {
    if (!this.hasRole(admin, UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут удалять рекомендации',
      );
    }

    const recommendation = await this.findOne(id, admin);
    await this.recommendationRepository.remove(recommendation);
  }

  async getStatistics(user: User): Promise<any> {
    const queryBuilder =
      this.recommendationRepository.createQueryBuilder('recommendation');

    // Фильтрация в зависимости от роли
    if (this.isOnlyAuthor(user)) {
      queryBuilder.where('recommendation.assignedToId = :userId', {
        userId: user.id,
      });
    } else if (this.hasRole(user, UserRole.EXPERT)) {
      queryBuilder.where('recommendation.createdById = :userId', {
        userId: user.id,
      });
    }

    const total = await queryBuilder.getCount();

    const statusCounts = await queryBuilder
      .select('recommendation.status, COUNT(*) as count')
      .groupBy('recommendation.status')
      .getRawMany();

    const typeCounts = await queryBuilder
      .select('recommendation.type, COUNT(*) as count')
      .groupBy('recommendation.type')
      .getRawMany();

    const priorityCounts = await queryBuilder
      .select('recommendation.priority, COUNT(*) as count')
      .groupBy('recommendation.priority')
      .getRawMany();

    // Статистика по срокам выполнения
    const overdueCount = await queryBuilder
      .where(
        'recommendation.dueDate < :now AND recommendation.status != :resolved',
        {
          now: new Date(),
          resolved: RecommendationStatus.RESOLVED,
        },
      )
      .getCount();

    return {
      total,
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      typeCounts: typeCounts.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count);
        return acc;
      }, {}),
      priorityCounts: priorityCounts.reduce((acc, item) => {
        acc[item.priority] = parseInt(item.count);
        return acc;
      }, {}),
      overdueCount,
    };
  }

  // 1.8 Добавление и редактирование данных в системе рекомендаций (для администратора)
  async createSystemRecommendation(
    createDto: CreateRecommendationDto,
    admin: User,
  ): Promise<Recommendation> {
    if (!this.hasRole(admin, UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут создавать системные рекомендации',
      );
    }

    // Системные рекомендации не привязаны к конкретной программе
    const recommendation = new Recommendation();
    recommendation.title = createDto.title;
    recommendation.content = createDto.content;
    if (createDto.type) {
      recommendation.type = createDto.type;
    }
    recommendation.priority = createDto.priority || 1;
    recommendation.createdById = admin.id;
    (recommendation as any).programId = null;
    (recommendation as any).assignedToId = null;

    return await this.recommendationRepository.save(recommendation);
  }

  async updateSystemRecommendation(
    id: string,
    updateDto: UpdateRecommendationDto,
    admin: User,
  ): Promise<Recommendation> {
    if (!this.hasRole(admin, UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут редактировать системные рекомендации',
      );
    }

    const recommendation = await this.recommendationRepository.findOne({
      where: { id },
    });

    if (!recommendation) {
      throw new NotFoundException('Рекомендация не найдена');
    }

    Object.assign(recommendation, updateDto);
    return await this.recommendationRepository.save(recommendation);
  }

  async deleteSystemRecommendation(id: string, admin: User): Promise<void> {
    if (!this.hasRole(admin, UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут удалять системные рекомендации',
      );
    }

    const recommendation = await this.recommendationRepository.findOne({
      where: { id },
    });

    if (!recommendation) {
      throw new NotFoundException('Рекомендация не найдена');
    }

    await this.recommendationRepository.remove(recommendation);
  }

  // Получение системных рекомендаций (доступных всем)
  async getSystemRecommendations(type?: string): Promise<Recommendation[]> {
    const where: any = { programId: null }; // Системные рекомендации
    if (type) {
      where.type = type;
    }

    return await this.recommendationRepository.find({
      where,
      relations: ['createdBy'],
      order: { priority: 'DESC', createdAt: 'DESC' },
    });
  }

  // Получение рекомендаций для конкретного шага создания программы
  async getRecommendationsForStep(
    step: string,
    programType?: string,
  ): Promise<Recommendation[]> {
    const queryBuilder = this.recommendationRepository
      .createQueryBuilder('recommendation')
      .leftJoinAndSelect('recommendation.createdBy', 'createdBy')
      .where('recommendation.programId IS NULL') // Системные рекомендации
      .andWhere('recommendation.status = :status', {
        status: RecommendationStatus.ACTIVE,
      });

    // Фильтр по типу/шагу создания программы
    if (step) {
      queryBuilder.andWhere('recommendation.type = :type', { type: step });
    }

    // Можно добавить фильтр по типу программы если нужно
    if (programType) {
      queryBuilder.andWhere('recommendation.metadata LIKE :programType', {
        programType: `%"programType":"${programType}"%`,
      });
    }

    queryBuilder
      .orderBy('recommendation.priority', 'DESC')
      .addOrderBy('recommendation.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  // Получение всех рекомендаций для администрирования
  async getAllRecommendationsForAdmin(admin: User): Promise<Recommendation[]> {
    if (!this.hasRole(admin, UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут просматривать все рекомендации',
      );
    }

    return await this.recommendationRepository.find({
      relations: ['program', 'createdBy', 'assignedTo', 'program.author'],
      order: { createdAt: 'DESC' },
    });
  }

  // Массовое обновление статуса рекомендаций
  async bulkUpdateStatus(
    ids: string[],
    status: RecommendationStatus,
    admin: User,
  ): Promise<void> {
    if (!this.hasRole(admin, UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут выполнять массовые операции',
      );
    }

    await this.recommendationRepository.update(ids, { status });
  }

  private checkAccess(recommendation: Recommendation, user: User): void {
    const hasAccess =
      user.roles.includes(UserRole.ADMIN) ||
      recommendation.createdById === user.id ||
      recommendation.assignedToId === user.id ||
      (this.isOnlyAuthor(user) && recommendation.program.authorId === user.id);

    if (!hasAccess) {
      throw new ForbiddenException('Нет доступа к этой рекомендации');
    }
  }
}
