import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole, UserStatus } from '../enums/user.enum';
import {
  AdminCreateUserDto,
  AdminUpdateUserDto,
  ChangeUserRoleDto,
  ChangeUserStatusDto,
} from '../dto/admin.dto';
import { EmailService } from './email.service';
import { Expertise } from '../../programs/entities/expertise.entity';
import { ExpertiseStatus } from '../../programs/enums/program.enum';
import * as crypto from 'crypto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Expertise)
    private expertiseRepository: Repository<Expertise>,
    private emailService: EmailService,
  ) {}

  // 1.1 Принятие нового пользователя в систему
  async approveUser(userId: string): Promise<User> {
    const user = await this.findUserById(userId);

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('User is already active');
    }

    user.status = UserStatus.ACTIVE;
    const savedUser = await this.userRepository.save(user);

    // Отправка welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.firstName);

    return savedUser;
  }

  // 1.1 Создание пользователя администратором
  async createUser(createUserDto: AdminCreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Генерируем временный пароль и токен приглашения
    const tempPassword = crypto.randomBytes(12).toString('hex');
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpiresAt = new Date();
    invitationExpiresAt.setHours(invitationExpiresAt.getHours() + 24); // 24 часа

    const user = this.userRepository.create({
      ...createUserDto,
      password: tempPassword, // Временный пароль, будет заменен при активации
      roles: createUserDto.roles || [UserRole.AUTHOR], // Изменено на массив ролей
      status: UserStatus.INACTIVE,
      invitationToken,
      invitationExpiresAt,
    });

    const savedUser = await this.userRepository.save(user);

    // Отправка приглашения
    await this.emailService.sendInvitationEmail(user.email, invitationToken);

    return savedUser;
  }

  // 1.2 Назначение и смена ролей пользователя (обновлено для множественных ролей)
  async assignRoles(
    userId: string,
    roles: UserRole[],
    adminUser: User,
  ): Promise<User> {
    if (!adminUser.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут назначать роли',
      );
    }

    const user = await this.findUserById(userId);
    user.roles = roles;
    return this.userRepository.save(user);
  }

  async addRole(
    userId: string,
    role: UserRole,
    adminUser: User,
  ): Promise<User> {
    if (!adminUser.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут добавлять роли',
      );
    }

    const user = await this.findUserById(userId);
    if (!user.roles.includes(role)) {
      user.roles.push(role);
    }
    return this.userRepository.save(user);
  }

  async removeRole(
    userId: string,
    role: UserRole,
    adminUser: User,
  ): Promise<User> {
    if (!adminUser.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут удалять роли');
    }

    const user = await this.findUserById(userId);
    user.roles = user.roles.filter((r) => r !== role);

    // Убеждаемся, что у пользователя есть хотя бы одна роль
    if (user.roles.length === 0) {
      user.roles = [UserRole.AUTHOR];
    }

    return this.userRepository.save(user);
  }

  // 1.2 Смена статуса пользователя
  async changeUserStatus(changeStatusDto: ChangeUserStatusDto): Promise<User> {
    const user = await this.findUserById(changeStatusDto.userId);
    user.status = changeStatusDto.status;
    return this.userRepository.save(user);
  }

  // 1.3 Редактирование данных пользователей
  async updateUser(
    userId: string,
    updateUserDto: AdminUpdateUserDto,
  ): Promise<User> {
    const user = await this.findUserById(userId);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  // 1.4 Отправка приглашений по смене пароля
  async sendPasswordResetInvitation(userId: string): Promise<void> {
    const user = await this.findUserById(userId);

    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpiresAt = new Date();
    invitationExpiresAt.setHours(invitationExpiresAt.getHours() + 24);

    user.invitationToken = invitationToken;
    user.invitationExpiresAt = invitationExpiresAt;
    await this.userRepository.save(user);

    await this.emailService.sendInvitationEmail(user.email, invitationToken);
  }

  // 1.5 Отправка в архив
  async archiveUser(userId: string): Promise<User> {
    const user = await this.findUserById(userId);
    user.status = UserStatus.ARCHIVED;
    return this.userRepository.save(user);
  }

  // 1.5 Возвращение из архива
  async unarchiveUser(userId: string): Promise<User> {
    const user = await this.findUserById(userId);
    if (user.status === UserStatus.ARCHIVED) {
      user.status = UserStatus.ACTIVE;
    }
    return this.userRepository.save(user);
  }

  // 1.6 Удаление (сокрытие) пользователя
  async hideUser(userId: string): Promise<User> {
    const user = await this.findUserById(userId);
    user.status = UserStatus.HIDDEN;
    return this.userRepository.save(user);
  }

  // Получение всех пользователей для администрирования
  async getAllUsers(includeHidden = false): Promise<User[]> {
    const query = this.userRepository.createQueryBuilder('user');

    if (!includeHidden) {
      query.where('user.status != :hiddenStatus', {
        hiddenStatus: UserStatus.HIDDEN,
      });
    }

    return query.getMany();
  }

  // Получение пользователей по статусу
  async getUsersByStatus(status: UserStatus): Promise<User[]> {
    return this.userRepository.find({ where: { status } });
  }

  // Получение пользователей по роли
  async getUsersByRole(role: UserRole): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .where(':role = ANY(user.roles)', { role })
      .getMany();
  }

  // Получение неактивных пользователей (ожидающих одобрения)
  async getPendingUsers(): Promise<User[]> {
    return this.getUsersByStatus(UserStatus.INACTIVE);
  }

  // A1.4 Получение пользователей с расширенной фильтрацией и сортировкой
  async getAdminUsersTable(
    admin: User,
    filters?: {
      search?: string;
      role?: UserRole;
      status?: UserStatus;
      workplace?: string;
      department?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      page?: number;
      limit?: number;
    },
  ): Promise<{
    users: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут просматривать таблицу пользователей',
      );
    }

    let query = this.userRepository.createQueryBuilder('user');

    // Фильтрация
    if (filters?.search) {
      query = query.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.middleName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.role) {
      query = query.andWhere(':role = ANY(user.roles)', { role: filters.role });
    }

    if (filters?.status) {
      query = query.andWhere('user.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.workplace) {
      query = query.andWhere('user.workplace ILIKE :workplace', {
        workplace: `%${filters.workplace}%`,
      });
    }

    if (filters?.department) {
      query = query.andWhere('user.department ILIKE :department', {
        department: `%${filters.department}%`,
      });
    }

    // Сортировка
    const sortBy = filters?.sortBy || 'lastName';
    const sortOrder = filters?.sortOrder || 'ASC';
    query = query.orderBy(`user.${sortBy}`, sortOrder);

    // Пагинация
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;

    const [users, total] = await query
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    // Форматируем данные для таблицы администратора
    const formattedUsers = users.map((user) => ({
      id: user.id,
      lastName: user.lastName || '',
      firstName: user.firstName || '',
      middleName: user.middleName || '',
      email: user.email,
      phone: user.phone || '',
      position: user.position || '',
      workplace: user.workplace || '',
      department: user.department || '',
      subjects: user.subjects || [],
      academicDegree: user.academicDegree || '',
      supervisor: '', // Поле руководителя - может быть добавлено позже
      isAuthor: user.roles.includes(UserRole.AUTHOR),
      isExpert: user.roles.includes(UserRole.EXPERT),
      isAdmin: user.roles.includes(UserRole.ADMIN),
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return {
      users: formattedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // A1.4 Массовое управление пользователями
  async bulkUpdateUsers(
    admin: User,
    userIds: string[],
    updates: {
      roles?: UserRole[];
      status?: UserStatus;
      workplace?: string;
      department?: string;
    },
  ): Promise<{ updated: number; failed: number }> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут массово обновлять пользователей',
      );
    }

    let updated = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        const user = await this.userRepository.findOne({
          where: { id: userId },
        });
        if (user) {
          if (updates.roles) user.roles = updates.roles;
          if (updates.status) user.status = updates.status;
          if (updates.workplace) user.workplace = updates.workplace;
          if (updates.department) user.department = updates.department;

          await this.userRepository.save(user);
          updated++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
      }
    }

    return { updated, failed };
  }

  // A1.5 Получение экспертов с детальной информацией
  async getAdminExpertsTable(
    admin: User,
    filters?: {
      search?: string;
      subject?: string;
      region?: string;
      workplace?: string;
      isActive?: boolean;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      page?: number;
      limit?: number;
    },
  ): Promise<{
    experts: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут просматривать таблицу экспертов',
      );
    }

    let query = this.userRepository
      .createQueryBuilder('user')
      .where(':role = ANY(user.roles)', { role: UserRole.EXPERT });

    // Фильтрация
    if (filters?.search) {
      query = query.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.middleName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.subject) {
      query = query.andWhere(':subject = ANY(user.subjects)', {
        subject: filters.subject,
      });
    }

    if (filters?.workplace) {
      query = query.andWhere('user.workplace ILIKE :workplace', {
        workplace: `%${filters.workplace}%`,
      });
    }

    if (filters?.isActive !== undefined) {
      query = query.andWhere('user.status = :status', {
        status: filters.isActive ? UserStatus.ACTIVE : UserStatus.INACTIVE,
      });
    }

    // Сортировка
    const sortBy = filters?.sortBy || 'lastName';
    const sortOrder = filters?.sortOrder || 'ASC';
    query = query.orderBy(`user.${sortBy}`, sortOrder);

    // Пагинация
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;

    const [experts, total] = await query
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    // Получаем статистику экспертиз для каждого эксперта
    const formattedExperts = await Promise.all(
      experts.map(async (expert) => {
        const expertiseStats = await this.getExpertExpertiseStats(expert.id);

        return {
          id: expert.id,
          lastName: expert.lastName || '',
          firstName: expert.firstName || '',
          middleName: expert.middleName || '',
          email: expert.email,
          phone: expert.phone || '',
          position: expert.position || '',
          workplace: expert.workplace || '',
          department: expert.department || '',
          subjects: expert.subjects || [],
          academicDegree: expert.academicDegree || '',
          status: expert.status,
          expertiseCount: expertiseStats.total,
          pendingExpertiseCount: expertiseStats.pending,
          completedExpertiseCount: expertiseStats.completed,
          averageRating: expertiseStats.averageRating,
          lastActivity: expert.updatedAt,
          createdAt: expert.createdAt,
        };
      }),
    );

    return {
      experts: formattedExperts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Вспомогательный метод для получения статистики экспертиз
  private async getExpertExpertiseStats(expertId: string): Promise<{
    total: number;
    pending: number;
    completed: number;
    averageRating: number;
  }> {
    const total = await this.expertiseRepository.count({
      where: { expert: { id: expertId } },
    });

    const pending = await this.expertiseRepository.count({
      where: {
        expert: { id: expertId },
        status: ExpertiseStatus.PENDING,
      },
    });

    const completed = await this.expertiseRepository.count({
      where: {
        expert: { id: expertId },
        status: ExpertiseStatus.COMPLETED,
      },
    });

    // Вычисляем средний балл по завершенным экспертизам
    const completedExpertises = await this.expertiseRepository.find({
      where: {
        expert: { id: expertId },
        status: ExpertiseStatus.COMPLETED,
        totalScore: MoreThan(0),
      },
      select: ['totalScore'],
    });

    const averageRating =
      completedExpertises.length > 0
        ? completedExpertises.reduce((sum, e) => sum + e.totalScore, 0) /
          completedExpertises.length
        : 0;

    return {
      total,
      pending,
      completed,
      averageRating: Math.round(averageRating * 10) / 10, // Округляем до 1 знака после запятой
    };
  }

  // A1.5 Управление назначениями экспертов
  async reassignExpert(
    admin: User,
    expertiseId: string,
    newExpertId: string,
  ): Promise<void> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут переназначать экспертов',
      );
    }

    const expertise = await this.expertiseRepository.findOne({
      where: { id: expertiseId },
      relations: ['expert', 'program'],
    });

    if (!expertise) {
      throw new NotFoundException('Экспертиза не найдена');
    }

    const newExpert = await this.userRepository.findOne({
      where: { id: newExpertId },
    });

    if (!newExpert || !newExpert.roles.includes(UserRole.EXPERT)) {
      throw new NotFoundException(
        'Новый эксперт не найден или не является экспертом',
      );
    }

    const oldExpert = expertise.expert;
    expertise.expert = newExpert;
    expertise.status = ExpertiseStatus.PENDING;

    await this.expertiseRepository.save(expertise);

    // Уведомления отправляются через существующие методы
    // await this.emailService.sendNotification(newExpert.email, 'Назначена новая экспертиза', ...);
    // await this.emailService.sendNotification(oldExpert.email, 'Экспертиза переназначена', ...);
  }

  // A1.6 Получение программ для административного управления
  async getAdminProgramsTable(
    admin: User,
    filters?: {
      search?: string;
      authorId?: string;
      status?: string;
      subject?: string;
      targetAudience?: string;
      category?: string;
      hasExpertise?: boolean;
      createdFrom?: Date;
      createdTo?: Date;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      page?: number;
      limit?: number;
    },
  ): Promise<{
    programs: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут просматривать административную таблицу программ',
      );
    }

    // Для этого метода нужен доступ к Program repository
    // Используем прямой SQL запрос через EntityManager
    const entityManager = this.userRepository.manager;

    let queryBuilder = entityManager
      .createQueryBuilder()
      .select([
        'p.id as id',
        'p.title as title',
        'p.description as description',
        'p.status as status',
        'p.subject as subject',
        'p.targetAudience as "targetAudience"',
        'p.category as category',
        'p.version as version',
        'p.createdAt as "createdAt"',
        'p.updatedAt as "updatedAt"',
        'u.firstName as "authorFirstName"',
        'u.lastName as "authorLastName"',
        'u.email as "authorEmail"',
        'COUNT(DISTINCT e.id) as "expertiseCount"',
        'COUNT(DISTINCT CASE WHEN e.status = \'completed\' THEN e.id END) as "completedExpertiseCount"',
      ])
      .from('programs', 'p')
      .leftJoin('users', 'u', 'p.authorId = u.id')
      .leftJoin('expertises', 'e', 'p.id = e.programId')
      .groupBy('p.id, u.id');

    // Фильтрация
    if (filters?.search) {
      queryBuilder = queryBuilder.andWhere(
        '(p.title ILIKE :search OR p.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.authorId) {
      queryBuilder = queryBuilder.andWhere('p.authorId = :authorId', {
        authorId: filters.authorId,
      });
    }

    if (filters?.status) {
      queryBuilder = queryBuilder.andWhere('p.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.subject) {
      queryBuilder = queryBuilder.andWhere('p.subject = :subject', {
        subject: filters.subject,
      });
    }

    if (filters?.targetAudience) {
      queryBuilder = queryBuilder.andWhere(
        'p.targetAudience = :targetAudience',
        {
          targetAudience: filters.targetAudience,
        },
      );
    }

    if (filters?.category) {
      queryBuilder = queryBuilder.andWhere('p.category = :category', {
        category: filters.category,
      });
    }

    if (filters?.createdFrom) {
      queryBuilder = queryBuilder.andWhere('p.createdAt >= :createdFrom', {
        createdFrom: filters.createdFrom,
      });
    }

    if (filters?.createdTo) {
      queryBuilder = queryBuilder.andWhere('p.createdAt <= :createdTo', {
        createdTo: filters.createdTo,
      });
    }

    if (filters?.hasExpertise !== undefined) {
      if (filters.hasExpertise) {
        queryBuilder = queryBuilder.having('COUNT(DISTINCT e.id) > 0');
      } else {
        queryBuilder = queryBuilder.having('COUNT(DISTINCT e.id) = 0');
      }
    }

    // Подсчет общего количества для пагинации
    const countQuery = queryBuilder.clone();
    const totalResult = await countQuery.getRawMany();
    const total = totalResult.length;

    // Сортировка
    const sortBy = filters?.sortBy || 'createdAt';
    const sortOrder = filters?.sortOrder || 'DESC';

    if (sortBy === 'authorName') {
      queryBuilder = queryBuilder.orderBy('u.lastName', sortOrder);
    } else if (sortBy === 'expertiseCount') {
      queryBuilder = queryBuilder.orderBy('"expertiseCount"', sortOrder);
    } else {
      queryBuilder = queryBuilder.orderBy(`p.${sortBy}`, sortOrder);
    }

    // Пагинация
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;

    const programs = await queryBuilder
      .offset(offset)
      .limit(limit)
      .getRawMany();

    // Форматируем данные
    const formattedPrograms = programs.map((program) => ({
      id: program.id,
      title: program.title,
      description: program.description,
      status: program.status,
      subject: program.subject,
      targetAudience: program.targetAudience,
      category: program.category,
      version: program.version,
      author: {
        firstName: program.authorFirstName,
        lastName: program.authorLastName,
        email: program.authorEmail,
      },
      expertiseCount: parseInt(program.expertiseCount) || 0,
      completedExpertiseCount: parseInt(program.completedExpertiseCount) || 0,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
    }));

    return {
      programs: formattedPrograms,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // A1.6 Административные действия с программами
  async bulkUpdatePrograms(
    admin: User,
    programIds: string[],
    updates: {
      status?: string;
      category?: string;
      archiveReason?: string;
    },
  ): Promise<{ updated: number; failed: number }> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут массово обновлять программы',
      );
    }

    const entityManager = this.userRepository.manager;
    let updated = 0;
    let failed = 0;

    for (const programId of programIds) {
      try {
        const updateData: any = {};
        if (updates.status) updateData.status = updates.status;
        if (updates.category) updateData.category = updates.category;
        if (updates.archiveReason)
          updateData.archiveReason = updates.archiveReason;

        updateData.updatedAt = new Date();

        const result = await entityManager
          .createQueryBuilder()
          .update('programs')
          .set(updateData)
          .where('id = :id', { id: programId })
          .execute();

        if (result.affected && result.affected > 0) {
          updated++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
      }
    }

    return { updated, failed };
  }

  // A1.6 Принудительное архивирование программы
  async forceArchiveProgram(
    admin: User,
    programId: string,
    reason: string,
  ): Promise<void> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут принудительно архивировать программы',
      );
    }

    const entityManager = this.userRepository.manager;

    await entityManager
      .createQueryBuilder()
      .update('programs')
      .set({
        status: 'archived',
        archiveReason: reason,
        archivedAt: new Date(),
        archivedBy: admin.id,
        updatedAt: new Date(),
      })
      .where('id = :id', { id: programId })
      .execute();
  }

  // A1.7 Получение и управление словарями
  async getAdminDictionariesTable(
    admin: User,
    filters?: {
      search?: string;
      category?: string;
      isActive?: boolean;
      parentId?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      page?: number;
      limit?: number;
    },
  ): Promise<{
    dictionaries: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут управлять словарями',
      );
    }

    const entityManager = this.userRepository.manager;

    let queryBuilder = entityManager
      .createQueryBuilder()
      .select([
        'd.id as id',
        'd.name as name',
        'd.value as value',
        'd.category as category',
        'd.isActive as "isActive"',
        'd.sortOrder as "sortOrder"',
        'd.parentId as "parentId"',
        'd.createdAt as "createdAt"',
        'd.updatedAt as "updatedAt"',
        'p.name as "parentName"',
        'COUNT(DISTINCT c.id) as "childrenCount"',
      ])
      .from('dictionaries', 'd')
      .leftJoin('dictionaries', 'p', 'd.parentId = p.id')
      .leftJoin('dictionaries', 'c', 'c.parentId = d.id')
      .groupBy('d.id, p.id');

    // Фильтрация
    if (filters?.search) {
      queryBuilder = queryBuilder.andWhere(
        '(d.name ILIKE :search OR d.value ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.category) {
      queryBuilder = queryBuilder.andWhere('d.category = :category', {
        category: filters.category,
      });
    }

    if (filters?.isActive !== undefined) {
      queryBuilder = queryBuilder.andWhere('d.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters?.parentId) {
      if (filters.parentId === 'null') {
        queryBuilder = queryBuilder.andWhere('d.parentId IS NULL');
      } else {
        queryBuilder = queryBuilder.andWhere('d.parentId = :parentId', {
          parentId: filters.parentId,
        });
      }
    }

    // Подсчет общего количества
    const countQuery = queryBuilder.clone();
    const totalResult = await countQuery.getRawMany();
    const total = totalResult.length;

    // Сортировка
    const sortBy = filters?.sortBy || 'sortOrder';
    const sortOrder = filters?.sortOrder || 'ASC';

    if (sortBy === 'parentName') {
      queryBuilder = queryBuilder.orderBy('p.name', sortOrder);
    } else if (sortBy === 'childrenCount') {
      queryBuilder = queryBuilder.orderBy('"childrenCount"', sortOrder);
    } else {
      queryBuilder = queryBuilder.orderBy(`d.${sortBy}`, sortOrder);
    }

    // Пагинация
    const page = filters?.page || 1;
    const limit = filters?.limit || 100;
    const offset = (page - 1) * limit;

    const dictionaries = await queryBuilder
      .offset(offset)
      .limit(limit)
      .getRawMany();

    // Форматируем данные
    const formattedDictionaries = dictionaries.map((dict) => ({
      id: dict.id,
      name: dict.name,
      value: dict.value,
      category: dict.category,
      isActive: dict.isActive,
      sortOrder: dict.sortOrder,
      parentId: dict.parentId,
      parentName: dict.parentName,
      childrenCount: parseInt(dict.childrenCount) || 0,
      createdAt: dict.createdAt,
      updatedAt: dict.updatedAt,
    }));

    return {
      dictionaries: formattedDictionaries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // A1.7 Создание нового элемента словаря
  async createDictionaryItem(
    admin: User,
    data: {
      name: string;
      value: string;
      category: string;
      parentId?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ): Promise<any> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут создавать элементы словарей',
      );
    }

    const entityManager = this.userRepository.manager;

    // Проверяем уникальность в рамках категории и родителя
    const existingItem = await entityManager
      .createQueryBuilder()
      .select('id')
      .from('dictionaries', 'd')
      .where('d.name = :name', { name: data.name })
      .andWhere('d.category = :category', { category: data.category })
      .andWhere(
        data.parentId ? 'd.parentId = :parentId' : 'd.parentId IS NULL',
        data.parentId ? { parentId: data.parentId } : {},
      )
      .getRawOne();

    if (existingItem) {
      throw new BadRequestException(
        'Элемент с таким названием уже существует в данной категории',
      );
    }

    // Если sortOrder не указан, устанавливаем следующий по порядку
    let sortOrder = data.sortOrder;
    if (!sortOrder) {
      const maxOrder = await entityManager
        .createQueryBuilder()
        .select('MAX(d.sortOrder)', 'maxOrder')
        .from('dictionaries', 'd')
        .where('d.category = :category', { category: data.category })
        .andWhere(
          data.parentId ? 'd.parentId = :parentId' : 'd.parentId IS NULL',
          data.parentId ? { parentId: data.parentId } : {},
        )
        .getRawOne();

      sortOrder = (maxOrder?.maxOrder || 0) + 1;
    }

    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into('dictionaries')
      .values({
        name: data.name,
        value: data.value,
        category: data.category,
        parentId: data.parentId || null,
        sortOrder: sortOrder,
        isActive: data.isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();

    return result.identifiers[0];
  }

  // A1.7 Обновление элемента словаря
  async updateDictionaryItem(
    admin: User,
    itemId: string,
    data: {
      name?: string;
      value?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ): Promise<void> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут редактировать элементы словарей',
      );
    }

    const entityManager = this.userRepository.manager;

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.value) updateData.value = data.value;
    if (data.sortOrder) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    updateData.updatedAt = new Date();

    const result = await entityManager
      .createQueryBuilder()
      .update('dictionaries')
      .set(updateData)
      .where('id = :id', { id: itemId })
      .execute();

    if (!result.affected || result.affected === 0) {
      throw new NotFoundException('Элемент словаря не найден');
    }
  }

  // A1.7 Удаление элемента словаря
  async deleteDictionaryItem(admin: User, itemId: string): Promise<void> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут удалять элементы словарей',
      );
    }

    const entityManager = this.userRepository.manager;

    // Проверяем, есть ли дочерние элементы
    const childrenCount = await entityManager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('dictionaries', 'd')
      .where('d.parentId = :parentId', { parentId: itemId })
      .getRawOne();

    if (parseInt(childrenCount.count) > 0) {
      throw new BadRequestException(
        'Нельзя удалить элемент словаря, у которого есть дочерние элементы',
      );
    }

    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from('dictionaries')
      .where('id = :id', { id: itemId })
      .execute();

    if (!result.affected || result.affected === 0) {
      throw new NotFoundException('Элемент словаря не найден');
    }
  }

  // A1.7 Массовое обновление порядка сортировки
  async reorderDictionaryItems(
    admin: User,
    items: { id: string; sortOrder: number }[],
  ): Promise<void> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут изменять порядок элементов словарей',
      );
    }

    const entityManager = this.userRepository.manager;

    await entityManager.transaction(async (transactionalEntityManager) => {
      for (const item of items) {
        await transactionalEntityManager
          .createQueryBuilder()
          .update('dictionaries')
          .set({
            sortOrder: item.sortOrder,
            updatedAt: new Date(),
          })
          .where('id = :id', { id: item.id })
          .execute();
      }
    });
  }

  private async findUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
