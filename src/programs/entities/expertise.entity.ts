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
import { ExpertiseStatus } from '../enums/program.enum';
import { ExpertPosition } from '../enums/expert-assignment.enum';

@Entity('expertises')
export class Expertise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ExpertiseStatus,
    default: ExpertiseStatus.PENDING,
  })
  status: ExpertiseStatus;

  @Column({
    type: 'enum',
    enum: ExpertPosition,
    nullable: true,
  })
  position: ExpertPosition; // Позиция эксперта (первый, второй, третий)

  @Column({ type: 'timestamp', nullable: true })
  assignedAt: Date; // Дата назначения эксперта

  @Column('text', { nullable: true })
  generalFeedback: string | null; // Общий отзыв эксперта

  @Column('text', { nullable: true })
  recommendations: string | null; // Рекомендации

  @Column('text', { nullable: true })
  conclusion: string | null; // Заключение

  // Критерии оценки согласно ТЗ (JSON формат для хранения структуры Criterion)
  
  // 1. Характеристика программы
  @Column('jsonb', { nullable: true })
  criterion1_1: { value: boolean; comment?: string; recommendation?: string }; // Актуальность разработки и реализации

  @Column('jsonb', { nullable: true })
  criterion1_2: { value: boolean; comment?: string; recommendation?: string }; // Цель и тема программы

  @Column('jsonb', { nullable: true })
  criterion1_3: { value: boolean; comment?: string; recommendation?: string }; // Профессиональный стандарт

  @Column('jsonb', { nullable: true })
  criterion1_4: { value: boolean; comment?: string; recommendation?: string }; // Планируемые результаты (знать/уметь)

  @Column('jsonb', { nullable: true })
  criterion1_5: { value: boolean; comment?: string; recommendation?: string }; // Планируемые результаты по программе

  // 2. Содержание программы
  @Column('jsonb', { nullable: true })
  criterion2_1: { value: boolean; comment?: string; recommendation?: string }; // Содержание соответствует теме

  @Column('jsonb', { nullable: true })
  criterion2_2: { value: boolean; comment?: string; recommendation?: string }; // Рабочие программы соответствуют плану

  @Column('text', { nullable: true })
  additionalRecommendation: string | null; // Дополнительные рекомендации

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date; // Дата завершения экспертизы

  @Column({ type: 'boolean', default: false })
  isRecommendedForApproval: boolean; // Рекомендуется к одобрению (автоматически вычисляется)

  @Column('text', { nullable: true })
  revisionComments: string; // Комментарии для доработки

  @Column({ type: 'timestamp', nullable: true })
  sentForRevisionAt: Date; // Дата отправки на доработку

  @Column({ type: 'int', default: 1 })
  revisionRound: number; // Номер круга доработки

  // Связи
  @ManyToOne(() => Program, program => program.expertises, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programId' })
  program: Program;

  @Column()
  programId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'expertId' })
  expert: User;

  @Column()
  expertId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedById' })
  assignedBy: User;

  @Column({ nullable: true })
  assignedById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
