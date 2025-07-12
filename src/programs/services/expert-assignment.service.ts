import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Program } from '../entities/program.entity';
import { UserRole } from '../../users/enums/user.enum';
import { ExpertAssignmentAlgorithm, ExpertPosition } from '../enums/expert-assignment.enum';

@Injectable()
export class ExpertAssignmentService {
  // ID Вейдт В.П. - третий эксперт по умолчанию
  private readonly VEIDT_EXPERT_ID = 'veidt-expert-id'; // В реальной системе это UUID из БД

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
  ) {}

  // Главный метод назначения экспертов
  async assignExperts(
    programId: string, 
    algorithm: ExpertAssignmentAlgorithm = ExpertAssignmentAlgorithm.KOIRO
  ): Promise<{ experts: User[], positions: ExpertPosition[] }> {
    const program = await this.programRepository.findOne({
      where: { id: programId },
      relations: ['author']
    });

    if (!program) {
      throw new NotFoundException('Программа не найдена');
    }

    switch (algorithm) {
      case ExpertAssignmentAlgorithm.KOIRO:
        return await this.assignExpertsKoiro(program);
      case ExpertAssignmentAlgorithm.REGIONAL:
        return await this.assignExpertsRegional(program);
      default:
        throw new BadRequestException('Неизвестный алгоритм назначения экспертов');
    }
  }

  // Алгоритм КОИРО для назначения экспертов
  private async assignExpertsKoiro(program: Program): Promise<{ experts: User[], positions: ExpertPosition[] }> {
    const experts: User[] = [];
    const positions: ExpertPosition[] = [];

    // 1. Первый эксперт - случайный из экспертов КОИРО
    const koiroExperts = await this.getKoiroExperts();
    const firstExpert = this.selectRandomExpert(koiroExperts, [program.authorId]);
    if (firstExpert) {
      experts.push(firstExpert);
      positions.push(ExpertPosition.FIRST);
    }

    // 2. Второй эксперт - начальник отдела автора
    const departmentHead = await this.getDepartmentHead(program.author.department);
    if (departmentHead && departmentHead.id !== firstExpert?.id) {
      experts.push(departmentHead);
      positions.push(ExpertPosition.SECOND);
    } else {
      // Если начальник не найден или совпадает с первым экспертом
      const alternativeExpert = this.selectRandomExpert(
        koiroExperts, 
        [program.authorId, firstExpert?.id].filter((id): id is string => Boolean(id))
      );
      if (alternativeExpert) {
        experts.push(alternativeExpert);
        positions.push(ExpertPosition.SECOND);
      }
    }

    // 3. Третий эксперт - Вейдт В.П.
    const veidtExpert = await this.getVeidtExpert();
    if (veidtExpert && !experts.find(e => e.id === veidtExpert.id)) {
      experts.push(veidtExpert);
      positions.push(ExpertPosition.THIRD);
    }

    return { experts, positions };
  }

  // Региональный алгоритм назначения экспертов
  private async assignExpertsRegional(program: Program): Promise<{ experts: User[], positions: ExpertPosition[] }> {
    const experts: User[] = [];
    const positions: ExpertPosition[] = [];

    // 1. Первый эксперт - любой случайный эксперт
    const allExperts = await this.getAllExperts();
    const firstExpert = this.selectRandomExpert(allExperts, [program.authorId]);
    if (firstExpert) {
      experts.push(firstExpert);
      positions.push(ExpertPosition.FIRST);
    }

    // 2. Второй эксперт - по предмету программы
    const subjectExperts = await this.getExpertsBySubject(program.targetAudience); // Используем целевую аудиторию как предмет
    const secondExpert = this.selectRandomExpert(
      subjectExperts, 
      [program.authorId, firstExpert?.id].filter((id): id is string => Boolean(id))
    );
    if (secondExpert) {
      experts.push(secondExpert);
      positions.push(ExpertPosition.SECOND);
    } else {
      // Если по предмету не найдено, берем любого другого
      const alternativeExpert = this.selectRandomExpert(
        allExperts,
        [program.authorId, firstExpert?.id].filter((id): id is string => Boolean(id))
      );
      if (alternativeExpert) {
        experts.push(alternativeExpert);
        positions.push(ExpertPosition.SECOND);
      }
    }

    // 3. Третий эксперт - Вейдт В.П.
    const veidtExpert = await this.getVeidtExpert();
    if (veidtExpert && !experts.find(e => e.id === veidtExpert.id)) {
      experts.push(veidtExpert);
      positions.push(ExpertPosition.THIRD);
    }

    return { experts, positions };
  }

  // Получить экспертов КОИРО
  private async getKoiroExperts(): Promise<User[]> {
    return await this.userRepository.find({
      where: {
        roles: UserRole.EXPERT as any, // TypeORM array contains
        workplace: 'КОИРО'
      }
    });
  }

  // Получить всех экспертов
  private async getAllExperts(): Promise<User[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where(':role = ANY(user.roles)', { role: UserRole.EXPERT })
      .getMany();
  }

  // Получить экспертов по предмету
  private async getExpertsBySubject(subject: string): Promise<User[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where(':role = ANY(user.roles)', { role: UserRole.EXPERT })
      .andWhere(':subject = ANY(user.subjects)', { subject })
      .getMany();
  }

  // Получить начальника отдела
  private async getDepartmentHead(department: string): Promise<User | null> {
    if (!department) return null;

    return await this.userRepository
      .createQueryBuilder('user')
      .where(':role = ANY(user.roles)', { role: UserRole.EXPERT })
      .andWhere('user.department = :department', { department })
      .andWhere('user.position ILIKE :position', { position: '%начальник%' })
      .getOne();
  }

  // Получить Вейдт В.П.
  private async getVeidtExpert(): Promise<User | null> {
    // В реальной системе это будет поиск по конкретному ID или email
    return await this.userRepository.findOne({
      where: { 
        email: 'veidt@koiro.ru' // Или другой способ идентификации
      }
    });
  }

  // Выбрать случайного эксперта исключая определенных пользователей
  private selectRandomExpert(experts: User[], excludeIds: string[]): User | null {
    const availableExperts = experts.filter(expert => 
      !excludeIds.includes(expert.id)
    );

    if (availableExperts.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * availableExperts.length);
    return availableExperts[randomIndex];
  }

  // Проверить уникальность экспертов
  private ensureUniqueExperts(experts: User[]): boolean {
    const uniqueIds = new Set(experts.map(expert => expert.id));
    return uniqueIds.size === experts.length;
  }
}
