import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Program } from './program.entity';

export enum RecommendationType {
  GENERAL = 'general',           // Общие рекомендации
  CONTENT = 'content',           // По содержанию
  METHODOLOGY = 'methodology',   // По методологии
  STRUCTURE = 'structure',       // По структуре
  ASSESSMENT = 'assessment',     // По оценке
}

export enum RecommendationStatus {
  ACTIVE = 'active',       // Активная
  RESOLVED = 'resolved',   // Выполнена
  IGNORED = 'ignored',     // Проигнорирована
  ARCHIVED = 'archived',   // В архиве
}

@Entity('recommendations')
export class Recommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string; // Заголовок рекомендации

  @Column('text')
  content: string; // Содержание рекомендации

  @Column({
    type: 'enum',
    enum: RecommendationType,
    default: RecommendationType.GENERAL,
  })
  type: RecommendationType;

  @Column({
    type: 'enum',
    enum: RecommendationStatus,
    default: RecommendationStatus.ACTIVE,
  })
  status: RecommendationStatus;

  @Column({ type: 'int', default: 1 })
  priority: number; // Приоритет (1-высокий, 2-средний, 3-низкий)

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date; // Срок выполнения

  @Column('text', { nullable: true })
  authorResponse: string; // Ответ автора на рекомендацию

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date; // Дата выполнения

  @Column('text', { nullable: true })
  expertFeedback: string; // Обратная связь эксперта

  // Связи
  @ManyToOne(() => Program, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'programId' })
  program: Program;

  @Column({ nullable: true })
  programId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @Column({ nullable: true })
  assignedToId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
