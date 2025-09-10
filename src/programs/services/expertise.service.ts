import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Expertise } from '../entities/expertise.entity';
import { Program } from '../entities/program.entity';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user.enum';
import { ExpertiseStatus, ProgramStatus } from '../enums/program.enum';
import { ExpertPosition } from '../enums/expert-assignment.enum';
import {
  CreateExpertiseDto,
  SubmitExpertiseDto,
  AssignExpertDto,
  ExpertiseQueryDto,
  SendForRevisionDto,
} from '../dto/expertise.dto';

@Injectable()
export class ExpertiseService {
  constructor(
    @InjectRepository(Expertise)
    private readonly expertiseRepository: Repository<Expertise>,
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createExpertiseDto: CreateExpertiseDto, assignedBy: User): Promise<Expertise> {
    if (!this.hasRole(assignedBy, UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут назначать экспертизы');
    }

    const program = await this.programRepository.findOne({
      where: { id: createExpertiseDto.programId },
    });

    if (!program) {
      throw new NotFoundException('Программа не найдена');
    }

    if (program.status !== ProgramStatus.SUBMITTED) {
      throw new BadRequestException('Экспертизу можно назначить только для отправленных программ');
    }

    // Проверяем, что эксперт имеет соответствующую роль
    const expert = await this.getExpertById(createExpertiseDto.expertId);

    // Проверяем, что экспертиза еще не назначена этому эксперту для данной программы
    const existingExpertise = await this.expertiseRepository.findOne({
      where: {
        programId: createExpertiseDto.programId,
        expertId: createExpertiseDto.expertId,
      },
    });

    if (existingExpertise) {
      throw new BadRequestException('Экспертиза уже назначена этому эксперту для данной программы');
    }

    const expertise = this.expertiseRepository.create({
      ...createExpertiseDto,
      assignedById: assignedBy.id,
      status: ExpertiseStatus.PENDING,
    });

    // Обновляем статус программы
    await this.programRepository.update(program.id, {
      status: ProgramStatus.IN_REVIEW,
    });

    return await this.expertiseRepository.save(expertise);
  }

  async findAll(query: ExpertiseQueryDto, user: User): Promise<{ data: Expertise[]; total: number }> {
    const {
      status,
      expertId,
      programId,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
    } = query;

    const queryBuilder = this.expertiseRepository
      .createQueryBuilder('expertise')
      .leftJoinAndSelect('expertise.program', 'program')
      .leftJoinAndSelect('expertise.expert', 'expert')
      .leftJoinAndSelect('expertise.assignedBy', 'assignedBy')
      .leftJoinAndSelect('program.author', 'author');

    // Фильтрация для экспертов - только их экспертизы
    if (this.hasRole(user, UserRole.EXPERT)) {
      queryBuilder.andWhere('expertise.expertId = :userId', { userId: user.id });
    }

    // Фильтрация по статусу
    if (status) {
      queryBuilder.andWhere('expertise.status = :status', { status });
    }

    // Фильтрация по эксперту
    if (expertId) {
      queryBuilder.andWhere('expertise.expertId = :expertId', { expertId });
    }

    // Фильтрация по программе
    if (programId) {
      queryBuilder.andWhere('expertise.programId = :programId', { programId });
    }

    // Сортировка
    const allowedSortFields = ['createdAt', 'updatedAt', 'reviewedAt', 'totalScore'];
    if (allowedSortFields.includes(sortBy)) {
      queryBuilder.orderBy(`expertise.${sortBy}`, sortOrder);
    }

    // Пагинация
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async findOne(id: string, user: User): Promise<Expertise> {
    const expertise = await this.expertiseRepository.findOne({
      where: { id },
      relations: ['program', 'program.author', 'expert', 'assignedBy'],
    });

    if (!expertise) {
      throw new NotFoundException('Экспертиза не найдена');
    }

    // Проверка доступа
    if (this.hasRole(user, UserRole.EXPERT) && expertise.expertId !== user.id) {
      throw new ForbiddenException('Нет доступа к этой экспертизе');
    }

    if (this.isOnlyAuthor(user) && expertise.program.authorId !== user.id) {
      throw new ForbiddenException('Нет доступа к этой экспертизе');
    }

    return expertise;
  }

  async submit(id: string, submitDto: SubmitExpertiseDto, expert: User): Promise<Expertise> {
    if (!this.hasRole(expert, UserRole.EXPERT)) {
      throw new ForbiddenException('Только эксперты могут отправлять экспертизы');
    }

    const expertise = await this.findOne(id, expert);

    if (expertise.expertId !== expert.id) {
      throw new ForbiddenException('Нет доступа к отправке этой экспертизы');
    }

    if (expertise.status === ExpertiseStatus.COMPLETED) {
      throw new BadRequestException('Экспертиза уже завершена');
    }

    // Сохраняем все критерии
    expertise.criterion1_1 = submitDto.criterion1_1;
    expertise.criterion1_2 = submitDto.criterion1_2;
    expertise.criterion1_3 = submitDto.criterion1_3;
    expertise.criterion1_4 = submitDto.criterion1_4;
    expertise.criterion1_5 = submitDto.criterion1_5;
    expertise.criterion2_1 = submitDto.criterion2_1;
    expertise.criterion2_2 = submitDto.criterion2_2;
    
    expertise.additionalRecommendation = submitDto.additionalRecommendation || null;
    expertise.generalFeedback = submitDto.generalFeedback || null;
    expertise.conclusion = submitDto.conclusion || null;

    // Автоматически вычисляем рекомендацию к одобрению
    expertise.isRecommendedForApproval = this.calculateRecommendation(submitDto);
    
    expertise.status = ExpertiseStatus.COMPLETED;
    expertise.reviewedAt = new Date();

    const savedExpertise = await this.expertiseRepository.save(expertise);

    // Проверяем, не пора ли принять финальное решение по программе
    await this.checkFinalDecision(expertise.programId);

    return savedExpertise;
  }

  // Вычисляет рекомендацию на основе критериев
  private calculateRecommendation(submitDto: SubmitExpertiseDto): boolean {
    // Если хоть один критерий имеет значение false, то не рекомендуется к одобрению
    const criteria = [
      submitDto.criterion1_1.value,
      submitDto.criterion1_2.value,
      submitDto.criterion1_3.value,
      submitDto.criterion1_4.value,
      submitDto.criterion1_5.value,
      submitDto.criterion2_1.value,
      submitDto.criterion2_2.value,
    ];

    return criteria.every(criterion => criterion === true);
  }

  // Проверяет, нужно ли принять финальное решение по программе
  private async checkFinalDecision(programId: string): Promise<void> {
    const program = await this.programRepository.findOne({
      where: { id: programId },
      relations: ['expertises'],
    });

    if (!program) return;

    const completedExpertises = program.expertises.filter(
      expertise => expertise.status === ExpertiseStatus.COMPLETED
    );

    // Если все 3 эксперта завершили работу
    if (completedExpertises.length >= 3) {
      const approvedCount = completedExpertises.filter(
        expertise => expertise.isRecommendedForApproval
      ).length;

      // Если хоть один эксперт дал отрицательную оценку - программа не одобрена
      const hasRejection = completedExpertises.some(
        expertise => !expertise.isRecommendedForApproval
      );

      if (hasRejection || approvedCount < 3) {
        program.status = ProgramStatus.NEEDS_REVISION;
      } else {
        program.status = ProgramStatus.APPROVED;
      }

      await this.programRepository.save(program);
    }
  }

  async assignExpert(programId: string, assignDto: AssignExpertDto, admin: User): Promise<Expertise> {
    if (!this.hasRole(admin, UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут назначать экспертов');
    }

    const createDto: CreateExpertiseDto = {
      programId,
      expertId: assignDto.expertId,
      initialComments: assignDto.assignmentMessage,
    };

    return await this.create(createDto, admin);
  }

  async getMyExpertises(expert: User, query: ExpertiseQueryDto): Promise<{ data: Expertise[]; total: number }> {
    if (!this.hasRole(expert, UserRole.EXPERT)) {
      throw new ForbiddenException('Только эксперты могут просматривать свои экспертизы');
    }

    return await this.findAll({ ...query, expertId: expert.id }, expert);
  }

  // 3.3 Получение всех ДПП ПК, по которым проводилась экспертиза (для экспертов)
  async getExpertPrograms(expertUser: User): Promise<Program[]> {
    if (!this.hasRole(expertUser, UserRole.EXPERT) && this.hasRole(expertUser, UserRole.ADMIN)) {
      throw new ForbiddenException('Только эксперты могут просматривать свои программы для экспертизы');
    }

    const expertises = await this.expertiseRepository.find({
      where: { expertId: expertUser.id },
      relations: ['program', 'program.author'],
      order: { createdAt: 'DESC' },
    });

    // Возвращаем уникальные программы
    const uniquePrograms = new Map<string, Program>();
    expertises.forEach(expertise => {
      if (!uniquePrograms.has(expertise.program.id)) {
        uniquePrograms.set(expertise.program.id, expertise.program);
      }
    });

    return Array.from(uniquePrograms.values());
  }

  // Получение экспертиз конкретного эксперта с расширенными фильтрами
  async getExpertExpertises(expert: User, filters?: {
    status?: ExpertiseStatus;
    programTitle?: string;
    authorName?: string;
    dateFrom?: Date;
    dateTo?: Date;
    result?: 'positive' | 'negative';
  }): Promise<any[]> {
    if (!this.hasRole(expert, UserRole.EXPERT)) {
      throw new ForbiddenException('Только эксперты могут просматривать свои экспертизы');
    }

    let query = this.expertiseRepository
      .createQueryBuilder('expertise')
      .leftJoinAndSelect('expertise.program', 'program')
      .leftJoinAndSelect('program.author', 'author')
      .where('expertise.expertId = :expertId', { expertId: expert.id })
      .orderBy('expertise.createdAt', 'DESC');

    // Применяем фильтры
    if (filters?.status) {
      query = query.andWhere('expertise.status = :status', { status: filters.status });
    }

    if (filters?.programTitle) {
      query = query.andWhere('program.title ILIKE :title', { 
        title: `%${filters.programTitle}%` 
      });
    }

    if (filters?.authorName) {
      query = query.andWhere(
        '(author.firstName ILIKE :name OR author.lastName ILIKE :name)',
        { name: `%${filters.authorName}%` }
      );
    }

    if (filters?.dateFrom) {
      query = query.andWhere('expertise.createdAt >= :dateFrom', { 
        dateFrom: filters.dateFrom 
      });
    }

    if (filters?.dateTo) {
      query = query.andWhere('expertise.createdAt <= :dateTo', { 
        dateTo: filters.dateTo 
      });
    }

    if (filters?.result) {
      const isPositive = filters.result === 'positive';
      query = query.andWhere('expertise.isRecommendedForApproval = :result', { 
        result: isPositive 
      });
    }

    const expertises = await query.getMany();

    // Форматируем данные для таблицы эксперта (3.4)
    return expertises.map((expertise, index) => ({
      expertiseNumber: `EXP-${expertise.id.substring(0, 8)}`, // Номер экспертного заключения
      programTitle: expertise.program.title, // Название программы
      receivedDate: expertise.createdAt, // Дата получения программы
      authorName: `${expertise.program.author.lastName} ${expertise.program.author.firstName}`, // Автор ДПП ПК
      programVersion: expertise.program.version, // Номер варианта программы
      programLink: `/programs/${expertise.program.id}`, // Ссылка на вариант программы
      result: expertise.isRecommendedForApproval ? 'Положительный' : 'Отрицательный', // Результат
      sentDate: expertise.reviewedAt, // Дата отправки экспертного заключения
      expertiseLink: `/expertise/${expertise.id}`, // Ссылка на экспертное заключение
    }));
  }

  // Получение доступных для экспертизы программ
  async getAvailablePrograms(expertUser: User): Promise<Program[]> {
    if (!this.hasRole(expertUser, UserRole.EXPERT) && !this.hasRole(expertUser, UserRole.ADMIN)) {
      throw new ForbiddenException('Только эксперты и администраторы могут просматривать программы для экспертизы');
    }

    // Получаем программы, которые отправлены на экспертизу и назначены данному эксперту
    const expertises = await this.expertiseRepository.find({
      where: { 
        expertId: expertUser.id,
        status: ExpertiseStatus.PENDING,
      },
      relations: ['program', 'program.author'],
    });

    // Фильтруем только программы, которые действительно отправлены на экспертизу
    return expertises
      .map(expertise => expertise.program)
      .filter(program => 
        program.status === ProgramStatus.SUBMITTED || 
        program.status === ProgramStatus.IN_REVIEW
      );
  }

  // Начать экспертизу
  async startExpertise(expertiseId: string, expertUser: User): Promise<Expertise> {
    const expertise = await this.findExpertiseByExpert(expertiseId, expertUser);

    if (expertise.status !== ExpertiseStatus.PENDING) {
      throw new BadRequestException('Экспертиза уже начата или завершена');
    }

    expertise.status = ExpertiseStatus.IN_PROGRESS;
    return await this.expertiseRepository.save(expertise);
  }

  // Вспомогательная функция для поиска экспертизы с проверкой прав эксперта
  private async findExpertiseByExpert(expertiseId: string, expertUser: User): Promise<Expertise> {
    const expertise = await this.expertiseRepository.findOne({
      where: { id: expertiseId },
      relations: ['program', 'program.author', 'expert'],
    });

    if (!expertise) {
      throw new NotFoundException('Экспертиза не найдена');
    }

    if (!this.hasRole(expertUser, UserRole.EXPERT) && !this.hasRole(expertUser, UserRole.ADMIN) && expertise.expertId !== expertUser.id) {
      throw new ForbiddenException('Вы можете работать только со своими экспертизами');
    }

    return expertise;
  }

  async remove(id: string, admin: User): Promise<void> {
    if (!this.hasRole(admin, UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут удалять экспертизы');
    }

    const expertise = await this.findOne(id, admin);
    await this.expertiseRepository.remove(expertise);
  }

  async getStatistics(user: User): Promise<any> {
    const queryBuilder = this.expertiseRepository.createQueryBuilder('expertise');

    // Для экспертов показываем только их статистику
    if (this.hasRole(user, UserRole.EXPERT)) {
      queryBuilder.where('expertise.expertId = :userId', { userId: user.id });
    }

    const total = await queryBuilder.getCount();

    const statusCounts = await queryBuilder
      .select('expertise.status, COUNT(*) as count')
      .groupBy('expertise.status')
      .getRawMany();

    const avgScores = await queryBuilder
      .select([
        'AVG(expertise.relevanceScore) as avgRelevance',
        'AVG(expertise.contentQualityScore) as avgContentQuality',
        'AVG(expertise.methodologyScore) as avgMethodology',
        'AVG(expertise.practicalValueScore) as avgPracticalValue',
        'AVG(expertise.innovationScore) as avgInnovation',
        'AVG(expertise.totalScore) as avgTotal',
      ])
      .where('expertise.totalScore IS NOT NULL')
      .getRawOne();

    return {
      total,
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      averageScores: avgScores,
    };
  }

  private async getExpertById(expertId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: expertId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  private calculateRecommendationFromCriteria(expertise: Expertise): boolean {
    // Проверяем все критерии
    const criteria = [
      expertise.criterion1_1?.value,
      expertise.criterion1_2?.value,
      expertise.criterion1_3?.value,
      expertise.criterion1_4?.value,
      expertise.criterion1_5?.value,
      expertise.criterion2_1?.value,
      expertise.criterion2_2?.value,
    ];

    // Если хоть один критерий false или undefined, то не рекомендуется
    return criteria.every(criterion => criterion === true);
  }

  // 1.8 Замена эксперта в случае необходимости
  async replaceExpert(expertiseId: string, oldExpertId: string, newExpertId: string, admin: User): Promise<Expertise> {
    // // Временный лог для отладки
    // throw new BadRequestException(`DEBUG: replaceExpert called with expertiseId=${expertiseId}, oldExpertId=${oldExpertId}, newExpertId=${newExpertId}`);
    
    console.log('replaceExpert called with:', { expertiseId, oldExpertId, newExpertId, adminId: admin.id });
    
    if (!this.hasRole(admin, UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут заменять экспертов');
    }

    const expertise = await this.expertiseRepository.findOne({
      where: { id: expertiseId },
      relations: ['program'],
    });

    console.log('Found expertise:', expertise ? { id: expertise?.id, expertId: expertise?.expertId } : 'null');

    if (!expertise) {
      throw new NotFoundException('Экспертиза не найдена');
    }

    console.log('Checking expertId:', { currentExpertId: expertise?.expertId, expectedOldExpertId: oldExpertId });
    
    if (expertise?.expertId !== oldExpertId) {
      throw new BadRequestException('Указанный эксперт не назначен на данную экспертизу');
    }

    // Проверяем, что новый эксперт имеет соответствующую роль
    const newExpert = await this.getExpertById(newExpertId);
    if (!newExpert.roles.includes(UserRole.EXPERT)) {
      throw new BadRequestException('Новый пользователь не имеет роли эксперта');
    }

    console.log('Before save - updating expertId from', expertise?.expertId, 'to', newExpertId);

    // Заменяем эксперта
    expertise.expertId = newExpertId;
    expertise.assignedById = admin.id;
    
    // Сбрасываем статус экспертизы если она уже была в процессе
    if (expertise.status === ExpertiseStatus.IN_PROGRESS) {
      expertise.status = ExpertiseStatus.PENDING;
    }

    const savedExpertise = await this.expertiseRepository.save(expertise);
    console.log('After save - expertId is now:', savedExpertise.expertId);

    return savedExpertise;
  }

  // Получение экспертиз для замены экспертов (административная функция)
  async getExpertisesForReplacement(admin: User): Promise<Expertise[]> {
    if (!this.hasRole(admin, UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут просматривать экспертизы для замены');
    }

    return await this.expertiseRepository.find({
      where: [
        { status: ExpertiseStatus.PENDING },
        { status: ExpertiseStatus.IN_PROGRESS }
      ],
      relations: ['program', 'expert', 'assignedBy', 'program.author'],
      order: { createdAt: 'DESC' },
    });
  }

  // Массовая замена эксперта во всех его экспертизах
  async replaceExpertInAllExpertises(oldExpertId: string, newExpertId: string, admin: User): Promise<number> {
    if (!this.hasRole(admin, UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут заменять экспертов');
    }

    // Проверяем нового эксперта
    const newExpert = await this.getExpertById(newExpertId);
    if (!newExpert.roles.includes(UserRole.EXPERT)) {
      throw new BadRequestException('Новый пользователь не имеет роли эксперта');
    }

    // Находим все активные экспертизы старого эксперта
    const expertises = await this.expertiseRepository.find({
      where: {
        expertId: oldExpertId,
        status: In([ExpertiseStatus.PENDING, ExpertiseStatus.IN_PROGRESS])
      }
    });

    // Заменяем эксперта во всех найденных экспертизах
    const updatePromises = expertises.map(expertise => {
      expertise.expertId = newExpertId;
      expertise.assignedById = admin.id;
      
      // Сбрасываем статус если экспертиза была в процессе
      if (expertise.status === ExpertiseStatus.IN_PROGRESS) {
        expertise.status = ExpertiseStatus.PENDING;
      }
      
      return this.expertiseRepository.save(expertise);
    });

    await Promise.all(updatePromises);
    return expertises.length;
  }

  // Получение PDF файла программы для эксперта
  async getProgramPdf(programId: string, expert: User): Promise<Buffer> {
    // Проверяем, что эксперт назначен на экспертизу этой программы
    const expertise = await this.expertiseRepository.findOne({
      where: { 
        programId,
        expertId: expert.id 
      }
    });

    if (!expertise) {
      throw new ForbiddenException('Нет доступа к этой программе');
    }

    // Здесь должна быть логика генерации PDF
    // Пока возвращаем заглушку
    throw new BadRequestException('Генерация PDF пока не реализована');
  }

  private hasRole(user: User, role: UserRole): boolean {
    return user && user.roles && Array.isArray(user.roles) && user.roles.includes(role);
  }

  private hasAnyRole(user: User, roles: UserRole[]): boolean {
    return user && user.roles && Array.isArray(user.roles) && roles.some(role => user.roles.includes(role));
  }

  private isOnlyAuthor(user: User): boolean {
    return this.hasRole(user, UserRole.AUTHOR) && !this.hasRole(user, UserRole.ADMIN) && !this.hasRole(user, UserRole.EXPERT);
  }

  // Отправка программы на доработку экспертом
  async sendForRevision(expertiseId: string, sendForRevisionDto: SendForRevisionDto, expert: User): Promise<Expertise> {
    const expertise = await this.expertiseRepository.findOne({
      where: { id: expertiseId },
      relations: ['program', 'expert', 'program.author']
    });

    if (!expertise) {
      throw new NotFoundException('Экспертиза не найдена');
    }

    if (expertise.expertId !== expert.id) {
      throw new ForbiddenException('Только назначенный эксперт может отправить программу на доработку');
    }

    if (expertise.status !== ExpertiseStatus.IN_PROGRESS) {
      throw new BadRequestException('Можно отправить на доработку только экспертизу в процессе');
    }

    // Обновляем экспертизу
    expertise.status = ExpertiseStatus.NEEDS_REVISION;
    expertise.revisionComments = sendForRevisionDto.revisionComments;
    if (sendForRevisionDto.generalFeedback) {
      expertise.generalFeedback = sendForRevisionDto.generalFeedback;
    }
    if (sendForRevisionDto.recommendations) {
      expertise.recommendations = sendForRevisionDto.recommendations;
    }
    expertise.sentForRevisionAt = new Date();
    expertise.reviewedAt = new Date();

    // Обновляем статус программы
    await this.programRepository.update(expertise.programId, {
      status: ProgramStatus.NEEDS_REVISION
    });

    const savedExpertise = await this.expertiseRepository.save(expertise);

    console.log(`Программа "${expertise.program.title}" отправлена на доработку экспертом ${expert.firstName} ${expert.lastName}`);
    
    return savedExpertise;
  }

  // Получение экспертиз, отправленных на доработку (для автора)
  async getRevisionExpertises(author: User): Promise<Expertise[]> {
    return await this.expertiseRepository.find({
      where: {
        status: ExpertiseStatus.NEEDS_REVISION,
        program: { authorId: author.id }
      },
      relations: ['program', 'expert'],
      order: { sentForRevisionAt: 'DESC' }
    });
  }
}
