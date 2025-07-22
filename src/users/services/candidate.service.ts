import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Candidate, CandidateStatus } from '../entities/candidate.entity';
import { User } from '../entities/user.entity';
import { UserRole, UserStatus } from '../enums/user.enum';
import {
  CreateCandidateDto,
  UpdateCandidateDto,
  CandidateResponseDto,
} from '../dto/candidate.dto';
import { EmailService } from './email.service';

@Injectable()
export class CandidateService {
  constructor(
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  // 1.1 Добавление кандидата в систему
  async createCandidate(
    createCandidateDto: CreateCandidateDto,
  ): Promise<Candidate> {
    // Проверяем, что пользователь с таким email еще не зарегистрирован
    const existingUser = await this.userRepository.findOne({
      where: { email: createCandidateDto.email },
    });
    if (existingUser) {
      throw new ConflictException(
        'Пользователь с таким email уже зарегистрирован',
      );
    }

    // Проверяем, что кандидат с таким email еще не добавлен
    const existingCandidate = await this.candidateRepository.findOne({
      where: { email: createCandidateDto.email },
    });
    if (existingCandidate) {
      throw new ConflictException('Кандидат с таким email уже добавлен');
    }

    const candidate = this.candidateRepository.create({
      ...createCandidateDto,
      proposedRoles: [UserRole.AUTHOR],
      status: CandidateStatus.PENDING,
    });

    return await this.candidateRepository.save(candidate);
  }

  // A1.1 Проверка дублирования кандидатов по ФИО и дате рождения
  async checkDuplicateCandidate(
    candidateData: CreateCandidateDto,
  ): Promise<boolean> {
    // Проверяем дублирование по email
    const existingByEmail = await this.candidateRepository.findOne({
      where: { email: candidateData.email },
    });
    if (existingByEmail) {
      return true;
    }

    // Проверяем дублирование среди пользователей
    const existingUser = await this.userRepository.findOne({
      where: { email: candidateData.email },
    });
    if (existingUser) {
      return true;
    }

    // Проверяем дублирование по ФИО (если все поля заполнены)
    if (
      candidateData.firstName &&
      candidateData.lastName &&
      candidateData.middleName
    ) {
      const duplicateByName = await this.candidateRepository.findOne({
        where: {
          firstName: candidateData.firstName,
          lastName: candidateData.lastName,
          middleName: candidateData.middleName,
        },
      });
      if (duplicateByName) {
        return true;
      }

      // Проверяем среди пользователей
      const duplicateUser = await this.userRepository.findOne({
        where: {
          firstName: candidateData.firstName,
          lastName: candidateData.lastName,
          middleName: candidateData.middleName,
        },
      });
      if (duplicateUser) {
        return true;
      }
    }

    return false;
  }

  // Обновленный метод создания кандидата с проверкой дублирования
  async createCandidateWithDuplicateCheck(
    createCandidateDto: CreateCandidateDto,
    admin: User,
  ): Promise<Candidate> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут добавлять кандидатов',
      );
    }

    // Проверяем дублирование
    const isDuplicate = await this.checkDuplicateCandidate(createCandidateDto);
    if (isDuplicate) {
      throw new ConflictException(
        'Кандидат с такими данными уже существует в системе',
      );
    }

    const candidate = this.candidateRepository.create({
      ...createCandidateDto,
      invitedById: admin.id,
      status: CandidateStatus.PENDING,
    });

    return await this.candidateRepository.save(candidate);
  }

  // Получение всех кандидатов
  async findAll(admin: User): Promise<Candidate[]> {

    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут просматривать кандидатов',
      );
    }

    return await this.candidateRepository.find({
      relations: ['invitedBy', 'registeredUser'],
      order: { createdAt: 'DESC' },
    });
  }

  // Получение кандидата по ID
  async findById(id: string, admin: User): Promise<Candidate> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут просматривать кандидатов',
      );
    }

    const candidate = await this.candidateRepository.findOne({
      where: { id },
      relations: ['invitedBy', 'registeredUser'],
    });

    if (!candidate) {
      throw new NotFoundException('Кандидат не найден');
    }

    return candidate;
  }

  // Обновление данных кандидата
  async updateCandidate(
    id: string,
    updateCandidateDto: UpdateCandidateDto,
    admin: User,
  ): Promise<Candidate> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут обновлять данные кандидатов',
      );
    }

    const candidate = await this.findById(id, admin);

    Object.assign(candidate, updateCandidateDto);

    return await this.candidateRepository.save(candidate);
  }

  // Отправка приглашения кандидату
  async inviteCandidate(id: string, admin: User): Promise<Candidate> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут отправлять приглашения',
      );
    }

    const candidate = await this.findById(id, admin);

    if (candidate.status !== CandidateStatus.PENDING) {
      throw new BadRequestException(
        'Приглашение можно отправить только кандидатам со статусом "ожидает"',
      );
    }

    try {
      // Отправляем приглашение по email
      await this.emailService.sendInvitationEmailForCandidate(
        candidate.email,
        candidate.firstName,
        candidate.proposedRoles,
      );

      candidate.status = CandidateStatus.INVITED;
      return await this.candidateRepository.save(candidate);
    } catch (error) {
      throw new BadRequestException(
        'Ошибка при отправке приглашения: ' + error.message,
      );
    }
  }

  // Массовая отправка приглашений
  async inviteMultipleCandidates(
    candidateIds: string[],
    admin: User,
  ): Promise<{ success: number; failed: number }> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут отправлять приглашения',
      );
    }

    let success = 0;
    let failed = 0;

    for (const id of candidateIds) {
      try {
        await this.inviteCandidate(id, admin);
        success++;
      } catch (error) {
        failed++;
      }
    }

    return { success, failed };
  }

  // Отклонение кандидата
  async rejectCandidate(id: string, admin: User): Promise<Candidate> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут отклонять кандидатов',
      );
    }

    const candidate = await this.findById(id, admin);
    candidate.status = CandidateStatus.REJECTED;

    return await this.candidateRepository.save(candidate);
  }

  // Удаление кандидата
  async deleteCandidate(id: string, admin: User): Promise<void> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут удалять кандидатов',
      );
    }

    const candidate = await this.findById(id, admin);
    await this.candidateRepository.remove(candidate);
  }

  // Связывание кандидата с зарегистрированным пользователем
  async linkCandidateToUser(
    candidateEmail: string,
    userId: string,
  ): Promise<void> {
    const candidate = await this.candidateRepository.findOne({
      where: { email: candidateEmail },
    });

    if (candidate) {
      candidate.registeredUserId = userId;
      candidate.status = CandidateStatus.REGISTERED;
      await this.candidateRepository.save(candidate);
    }
  }

  // Получение статистики кандидатов
  async getCandidateStats(admin: User): Promise<any> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут просматривать статистику',
      );
    }

    const total = await this.candidateRepository.count();
    const pending = await this.candidateRepository.count({
      where: { status: CandidateStatus.PENDING },
    });
    const invited = await this.candidateRepository.count({
      where: { status: CandidateStatus.INVITED },
    });
    const registered = await this.candidateRepository.count({
      where: { status: CandidateStatus.REGISTERED },
    });
    const rejected = await this.candidateRepository.count({
      where: { status: CandidateStatus.REJECTED },
    });

    return {
      total,
      pending,
      invited,
      registered,
      rejected,
      conversionRate: total > 0 ? Math.round((registered / total) * 100) : 0,
    };
  }

  // Создание кандидата для публичной регистрации (без админа)
  async createPublicCandidate(candidateData: any): Promise<Candidate> {
    // Проверяем, что пользователь с таким email еще не зарегистрирован
    const existingUser = await this.userRepository.findOne({
      where: { email: candidateData.email },
    });
    if (existingUser) {
      throw new ConflictException(
        'Пользователь с таким email уже зарегистрирован',
      );
    }

    // Проверяем, что кандидат с таким email еще не добавлен
    const existingCandidate = await this.candidateRepository.findOne({
      where: { email: candidateData.email },
    });
    if (existingCandidate) {
      throw new ConflictException('Заявка с таким email уже подана');
    }

    const newCandidate = {
      ...candidateData,
      status: CandidateStatus.PENDING,
    };

    const candidate = await this.candidateRepository.save(newCandidate);
    return candidate;
  }

  // Одобрение кандидата с созданием пользователя
  async approveCandidate(
    id: string,
    admin: User,
  ): Promise<{ user: User; password: string }> {
    if (!admin.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException(
        'Только администраторы могут одобрять кандидатов',
      );
    }

    const candidate = await this.findById(id, admin);

    if (
      candidate.status !== CandidateStatus.PENDING &&
      candidate.status !== CandidateStatus.INVITED
    ) {
      throw new BadRequestException(
        'Можно одобрить только кандидатов со статусом "ожидает" или "приглашен"',
      );
    }

    // Генерируем временный пароль
    const temporaryPassword = this.generateTemporaryPassword();

    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Создаем пользователя на основе данных кандидата
    const user = this.userRepository.create({
      email: candidate.email,
      password: hashedPassword,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      middleName: candidate.middleName,
      phone: candidate.phone,
      roles: candidate.proposedRoles as UserRole[],
      status: UserStatus.ACTIVE,
    });

    const savedUser = await this.userRepository.save(user);

    // Обновляем статус кандидата
    candidate.status = CandidateStatus.REGISTERED;
    candidate.registeredUserId = savedUser.id;
    await this.candidateRepository.save(candidate);

    // Отправляем email с данными для входа
    await this.emailService.sendLoginCredentials(
      savedUser.email,
      savedUser.firstName,
      temporaryPassword,
    );

    return { user: savedUser, password: temporaryPassword };
  }

  // Генерация временного пароля
  private generateTemporaryPassword(): string {
    const length = 12;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}
