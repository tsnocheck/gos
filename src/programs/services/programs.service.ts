import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Program } from '../entities/program.entity';
import { Expertise } from '../entities/expertise.entity';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user.enum';
import { ProgramStatus } from '../enums/program.enum';
import { Express } from 'express';
import { FileService } from './file.service';
import { ExpertAssignmentService } from './expert-assignment.service';
import {
  CreateProgramDto,
  UpdateProgramDto,
  SubmitProgramDto,
  ApproveProgramDto,
  RejectProgramDto,
  CreateVersionDto,
  ProgramQueryDto,
} from '../dto/program.dto';
import { CreateProgramFormDto } from '../dto/program-creation.dto';

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly fileService: FileService,
    private readonly expertAssignmentService: ExpertAssignmentService,
  ) {}

  private hasRole(user: User, role: UserRole): boolean {
    return user && user.roles && Array.isArray(user.roles) && user.roles.includes(role);
  }

  private hasAnyRole(user: User, roles: UserRole[]): boolean {
    return user && user.roles && Array.isArray(user.roles) && roles.some(role => user.roles.includes(role));
  }

  private isOnlyAuthor(user: User): boolean {
    return this.hasRole(user, UserRole.AUTHOR) && !this.hasRole(user, UserRole.ADMIN) && !this.hasRole(user, UserRole.EXPERT);
  }

  async create(createProgramDto: CreateProgramDto, author: User, file?: Express.Multer.File): Promise<Program> {
    if (!this.hasAnyRole(author, [UserRole.AUTHOR, UserRole.ADMIN])) {
      throw new ForbiddenException('Только авторы и администраторы могут создавать программы');
    }

    let fileData: {
      fileName: string;
      filePath: string;
      fileSize: number;
      mimeType: string;
    } | undefined;

    if (file) {
      fileData = await this.fileService.saveFile(file);
    }

    const programData = {
      ...createProgramDto,
      authorId: author.id,
      status: ProgramStatus.DRAFT,
      version: 1,
    };

    if (fileData) {
      Object.assign(programData, {
        fileName: fileData.fileName,
        filePath: fileData.filePath,
        fileSize: fileData.fileSize,
        mimeType: fileData.mimeType,
      });
    }

    const program = this.programRepository.create(programData);
    const savedProgram = await this.programRepository.save(program);

    // Автоматически назначаем 3 экспертов
    try {
      await this.expertAssignmentService.assignExperts(savedProgram.id);
      console.log(`Автоматически назначены эксперты для программы ${savedProgram.id}`);
    } catch (error) {
      console.warn(`Не удалось автоматически назначить экспертов для программы ${savedProgram.id}:`, error.message);
    }

    return savedProgram;
  }

  async findAll(query: ProgramQueryDto, user: User): Promise<{ data: Program[]; total: number }> {
    const {
      status,
      authorId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
    } = query;

    const queryBuilder = this.programRepository
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.author', 'author')
      .leftJoinAndSelect('program.approvedBy', 'approvedBy');

    // Фильтрация по статусу
    if (status) {
      queryBuilder.andWhere('program.status = :status', { status });
    }

    // Фильтрация по автору
    if (authorId) {
      queryBuilder.andWhere('program.authorId = :authorId', { authorId });
    }

    // Для авторов показываем только их программы
    if (this.isOnlyAuthor(user)) {
      queryBuilder.andWhere('program.authorId = :userId', { userId: user.id });
    }

    // Поиск по названию или описанию
    if (search) {
      queryBuilder.andWhere(
        '(program.title ILIKE :search OR program.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Сортировка
    const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'status'];
    if (allowedSortFields.includes(sortBy)) {
      queryBuilder.orderBy(`program.${sortBy}`, sortOrder);
    }

    // Пагинация
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async findOne(id: string, user: User): Promise<Program> {
    const program = await this.programRepository.findOne({
      where: { id },
      relations: ['author', 'approvedBy', 'expertises', 'expertises.expert'],
    });

    if (!program) {
      throw new NotFoundException('Программа не найдена');
    }

    // Проверка доступа
    if (this.isOnlyAuthor(user) && program.authorId !== user.id) {
      throw new ForbiddenException('Нет доступа к этой программе');
    }

    return program;
  }

  async update(id: string, updateProgramDto: UpdateProgramDto, user: User): Promise<Program> {
    const program = await this.findOne(id, user);

    // Проверка возможности редактирования
    if (program.status !== ProgramStatus.DRAFT && program.status !== ProgramStatus.REJECTED) {
      throw new BadRequestException('Можно редактировать только черновики или отклоненные программы');
    }

    // Проверка прав
    if (this.isOnlyAuthor(user) && program.authorId !== user.id) {
      throw new ForbiddenException('Нет доступа к редактированию этой программы');
    }

    Object.assign(program, updateProgramDto);
    return await this.programRepository.save(program);
  }

  async submit(id: string, submitDto: SubmitProgramDto, user: User): Promise<Program> {
    const program = await this.findOne(id, user);

    if (program.status !== ProgramStatus.DRAFT && program.status !== ProgramStatus.REJECTED) {
      throw new BadRequestException('Можно отправить на экспертизу только черновики или отклоненные программы');
    }

    if (this.isOnlyAuthor(user) && program.authorId !== user.id) {
      throw new ForbiddenException('Нет доступа к отправке этой программы');
    }

    program.status = ProgramStatus.SUBMITTED;
    program.submittedAt = new Date();

    return await this.programRepository.save(program);
  }

  async approve(id: string, approveDto: ApproveProgramDto, admin: User): Promise<Program> {
    if (!this.hasRole(admin, UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут одобрять программы');
    }

    const program = await this.findOne(id, admin);

    if (program.status !== ProgramStatus.IN_REVIEW) {
      throw new BadRequestException('Можно одобрить только программы на рассмотрении');
    }

    program.status = ProgramStatus.APPROVED;
    program.approvedAt = new Date();
    program.approvedById = admin.id;

    return await this.programRepository.save(program);
  }

  async reject(id: string, rejectDto: RejectProgramDto, admin: User): Promise<Program> {
    if (!this.hasRole(admin, UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут отклонять программы');
    }

    const program = await this.findOne(id, admin);

    if (program.status !== ProgramStatus.IN_REVIEW && program.status !== ProgramStatus.SUBMITTED) {
      throw new BadRequestException('Можно отклонить только отправленные или рассматриваемые программы');
    }

    program.status = ProgramStatus.REJECTED;
    program.rejectionReason = rejectDto.reason;

    return await this.programRepository.save(program);
  }

  async archive(id: string, admin: User): Promise<Program> {
    if (!this.hasRole(admin, UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут архивировать программы');
    }

    const program = await this.findOne(id, admin);
    program.status = ProgramStatus.ARCHIVED;
    program.archivedAt = new Date();

    return await this.programRepository.save(program);
  }

  async createVersion(id: string, createVersionDto: CreateVersionDto, user: User): Promise<Program> {
    const originalProgram = await this.findOne(id, user);

    if (originalProgram.status !== ProgramStatus.APPROVED) {
      throw new BadRequestException('Можно создать версию только одобренной программы');
    }

    if (this.isOnlyAuthor(user) && originalProgram.authorId !== user.id) {
      throw new ForbiddenException('Нет доступа к созданию версии этой программы');
    }

    const newVersion = this.programRepository.create({
      title: createVersionDto.title,
      description: createVersionDto.description || originalProgram.description,
      programCode: originalProgram.programCode,
      duration: originalProgram.duration,
      targetAudience: originalProgram.targetAudience,
      competencies: originalProgram.competencies,
      learningOutcomes: originalProgram.learningOutcomes,
      content: originalProgram.content,
      methodology: originalProgram.methodology,
      assessment: originalProgram.assessment,
      materials: originalProgram.materials,
      requirements: originalProgram.requirements,
      nprContent: originalProgram.nprContent,
      pmrContent: originalProgram.pmrContent,
      vrContent: originalProgram.vrContent,
      authorId: originalProgram.authorId,
      status: ProgramStatus.DRAFT,
      version: originalProgram.version + 1,
      parentId: originalProgram.id,
    });

    return await this.programRepository.save(newVersion);
  }

  async getVersions(id: string, user: User): Promise<Program[]> {
    const program = await this.findOne(id, user);

    // Найти все версии (включая родительскую)
    const versions = await this.programRepository.find({
      where: [
        { id: program.parentId || program.id },
        { parentId: program.parentId || program.id },
      ],
      relations: ['author', 'approvedBy'],
      order: { version: 'ASC' },
    });

    return versions;
  }

  async remove(id: string, admin: User): Promise<void> {
    if (!this.hasRole(admin, UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут удалять программы');
    }

    const program = await this.findOne(id, admin);
    await this.programRepository.remove(program);
  }

  async getStatistics(user: User): Promise<any> {
    const queryBuilder = this.programRepository.createQueryBuilder('program');

    // Для авторов показываем только их статистику
    if (this.isOnlyAuthor(user)) {
      queryBuilder.where('program.authorId = :userId', { userId: user.id });
    }

    const total = await queryBuilder.getCount();

    const statusCounts = await queryBuilder
      .select('program.status, COUNT(*) as count')
      .groupBy('program.status')
      .getRawMany();

    const monthlyStats = await queryBuilder
      .select([
        'EXTRACT(YEAR FROM program.createdAt) as year',
        'EXTRACT(MONTH FROM program.createdAt) as month',
        'COUNT(*) as count'
      ])
      .where('program.createdAt >= :date', { date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) })
      .groupBy('year, month')
      .orderBy('year, month')
      .getRawMany();

    return {
      total,
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      monthlyStats,
    };
  }

  // 1.5 Отправка программ в архив и возвращение из архива (для администратора)
  async archiveProgram(id: string, adminUser: User): Promise<Program> {
    if (!this.hasRole(adminUser, UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут архивировать программы');
    }

    const program = await this.findOne(id, adminUser);
    
    if (program.status === ProgramStatus.ARCHIVED) {
      throw new BadRequestException('Программа уже находится в архиве');
    }

    program.status = ProgramStatus.ARCHIVED;
    program.archivedAt = new Date();
    
    return await this.programRepository.save(program);
  }

  async unarchiveProgram(id: string, adminUser: User): Promise<Program> {
    if (!this.hasRole(adminUser, UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут извлекать программы из архива');
    }

    const program = await this.findOne(id, adminUser);
    
    if (program.status !== ProgramStatus.ARCHIVED) {
      throw new BadRequestException('Программа не находится в архиве');
    }

    // Восстанавливаем предыдущий статус (обычно draft или approved)
    program.status = program.approvedAt ? ProgramStatus.APPROVED : ProgramStatus.DRAFT;
    (program as any).archivedAt = null;
    
    return await this.programRepository.save(program);
  }

  // Получение архивированных программ
  async getArchivedPrograms(adminUser: User): Promise<Program[]> {
    if (!this.hasRole(adminUser, UserRole.ADMIN)) {
      throw new ForbiddenException('Только администраторы могут просматривать архив программ');
    }

    return await this.programRepository.find({
      where: { status: ProgramStatus.ARCHIVED },
      relations: ['author', 'approvedBy'],
      order: { archivedAt: 'DESC' },
    });
  }

  // 2.6 Получение, просмотр и скачивание заключения экспертов
  async getExpertiseResults(programId: string, user: User): Promise<Expertise[]> {
    const program = await this.findOne(programId, user);
    
    // Проверяем права доступа
    if (this.isOnlyAuthor(user) && program.authorId !== user.id) {
      throw new ForbiddenException('Вы можете просматривать только заключения по своим программам');
    }

    return await this.programRepository
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.expertises', 'expertise')
      .leftJoinAndSelect('expertise.expert', 'expert')
      .where('program.id = :programId', { programId })
      .andWhere('expertise.status = :status', { status: 'completed' })
      .getOne()
      .then(p => p?.expertises || []);
  }

  // 2.7 Создание новой версии программы после отклонения
  async createNewVersion(programId: string, author: User): Promise<Program> {
    const originalProgram = await this.programRepository.findOne({
      where: { id: programId },
      relations: ['author', 'expertises']
    });

    if (!originalProgram) {
      throw new NotFoundException('Программа не найдена');
    }

    // Проверяем, что пользователь является автором
    if (originalProgram.authorId !== author.id) {
      throw new ForbiddenException('Только автор может создать новую версию программы');
    }

    // Проверяем, что программа отклонена
    if (originalProgram.status !== ProgramStatus.REJECTED) {
      throw new BadRequestException('Новую версию можно создать только для отклоненной программы');
    }

    // Создаем новую версию программы
    const newVersion = new Program();
    newVersion.title = originalProgram.title;
    newVersion.description = originalProgram.description;
    newVersion.programCode = originalProgram.programCode;
    newVersion.duration = originalProgram.duration;
    newVersion.targetAudience = originalProgram.targetAudience;
    newVersion.competencies = originalProgram.competencies;
    newVersion.learningOutcomes = originalProgram.learningOutcomes;
    newVersion.content = originalProgram.content;
    newVersion.methodology = originalProgram.methodology;
    newVersion.assessment = originalProgram.assessment;
    newVersion.materials = originalProgram.materials;
    newVersion.requirements = originalProgram.requirements;
    newVersion.nprContent = originalProgram.nprContent;
    newVersion.pmrContent = originalProgram.pmrContent;
    newVersion.vrContent = originalProgram.vrContent;
    newVersion.authorId = originalProgram.authorId;
    newVersion.version = originalProgram.version + 1;
    newVersion.parentId = originalProgram.id;
    newVersion.status = ProgramStatus.DRAFT;

    return await this.programRepository.save(newVersion);
  }

  // 2.8 Получение всех версий программы
  async getProgramVersions(programId: string, author: User): Promise<Program[]> {
    // Находим корневую программу
    const rootProgram = await this.programRepository.findOne({
      where: { id: programId },
      relations: ['author']
    });

    if (!rootProgram) {
      throw new NotFoundException('Программа не найдена');
    }

    // Проверяем права доступа
    if (rootProgram.authorId !== author.id && !author.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Нет доступа к версиям этой программы');
    }

    // Находим все версии программы
    const versions = await this.programRepository.find({
      where: [
        { id: programId },
        { parentId: programId },
        { parentId: rootProgram.parentId || programId }
      ],
      relations: ['author', 'expertises', 'expertises.expert'],
      order: { version: 'ASC' }
    });

    return versions;
  }

  // Проверка возможности редактирования программы
  async canEditProgram(programId: string, author: User): Promise<boolean> {
    const program = await this.programRepository.findOne({
      where: { id: programId }
    });

    if (!program) {
      return false;
    }

    // Только автор может редактировать
    if (program.authorId !== author.id) {
      return false;
    }

    // Можно редактировать только черновики
    return program.status === ProgramStatus.DRAFT;
  }

  async downloadFile(id: string, user: User, res: any): Promise<void> {
    const program = await this.findOne(id, user);
    
    if (!program.filePath) {
      throw new NotFoundException('Файл не найден для этой программы');
    }

    if (!this.fileService.fileExists(program.filePath)) {
      throw new NotFoundException('Файл не существует на диске');
    }

    const filePath = this.fileService.getFilePath(program.filePath);
    
    res.setHeader('Content-Disposition', `attachment; filename="${program.fileName}"`);
    res.setHeader('Content-Type', program.mimeType || 'application/octet-stream');
    
    return res.sendFile(filePath);
  }

  // Новый метод для создания полной программы
  async createFullProgram(createProgramFormDto: CreateProgramFormDto, author: User): Promise<Program> {
    if (!this.hasAnyRole(author, [UserRole.AUTHOR, UserRole.ADMIN])) {
      throw new ForbiddenException('Только авторы и администраторы могут создавать программы');
    }

    // Проверяем существование соавторов
    if (createProgramFormDto.author1) {
      const author1 = await this.getAuthorById(createProgramFormDto.author1);
      if (!author1) {
        throw new BadRequestException('Первый соавтор не найден');
      }
    }

    if (createProgramFormDto.author2) {
      const author2 = await this.getAuthorById(createProgramFormDto.author2);
      if (!author2) {
        throw new BadRequestException('Второй соавтор не найден');
      }
    }

    const program = this.programRepository.create({
      // Основная информация
      title: createProgramFormDto.title,
      authorId: author.id,
      
      // Данные из формы создания
      institution: createProgramFormDto.institution,
      customInstitution: createProgramFormDto.customInstitution,
      author1Id: createProgramFormDto.author1,
      author2Id: createProgramFormDto.author2,
      abbreviations: createProgramFormDto.abbreviations || [],
      relevance: createProgramFormDto.relevance,
      goal: createProgramFormDto.goal,
      standard: createProgramFormDto.standard,
      functions: createProgramFormDto.functions || [],
      actions: createProgramFormDto.actions || [],
      duties: createProgramFormDto.duties || [],
      know: createProgramFormDto.know,
      can: createProgramFormDto.can,
      category: createProgramFormDto.category,
      educationForm: createProgramFormDto.educationForm,
      term: createProgramFormDto.term,
      modules: createProgramFormDto.modules || [],
      attestations: createProgramFormDto.attestations || [],
      topics: createProgramFormDto.topics || [],
      network: createProgramFormDto.network || [],
      networkEnabled: createProgramFormDto.networkEnabled || false,
      requirements: createProgramFormDto.requirements,
      criteria: createProgramFormDto.criteria,
      examples: createProgramFormDto.examples,
      attempts: createProgramFormDto.attempts,
      orgPedConditions: createProgramFormDto.orgPedConditions,
      
      status: ProgramStatus.DRAFT,
    });

    const savedProgram = await this.programRepository.save(program);

    // Автоматически назначаем 3 экспертов
    try {
      await this.expertAssignmentService.assignExperts(savedProgram.id);
      console.log(`Автоматически назначены эксперты для программы ${savedProgram.id}`);
    } catch (error) {
      console.warn(`Не удалось автоматически назначить экспертов для программы ${savedProgram.id}:`, error.message);
    }

    const createdProgram = await this.programRepository.findOne({
      where: { id: savedProgram.id },
      relations: ['author', 'author1', 'author2'],
    });

    if (!createdProgram) {
      throw new NotFoundException('Не удалось найти созданную программу');
    }

    return createdProgram;
  }

  private async getAuthorById(authorId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: authorId },
    });

    if (!user || !this.hasRole(user, UserRole.AUTHOR)) {
      return null;
    }

    return user;
  }
}
