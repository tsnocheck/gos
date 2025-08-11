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
  generalFeedback: string; // Общий отзыв эксперта

  @Column('text', { nullable: true })
  recommendations: string; // Рекомендации

  @Column('text', { nullable: true })
  conclusion: string; // Заключение

  // Критерии оценки (можно расширить)
  @Column({ type: 'int', nullable: true, default: 0 })
  relevanceScore: number; // Актуальность (0-10)

  @Column({ type: 'int', nullable: true, default: 0 })
  contentQualityScore: number; // Качество содержания (0-10)

  @Column({ type: 'int', nullable: true, default: 0 })
  methodologyScore: number; // Методология (0-10)

  @Column({ type: 'int', nullable: true, default: 0 })
  practicalValueScore: number; // Практическая ценность (0-10)

  @Column({ type: 'int', nullable: true, default: 0 })
  innovationScore: number; // Инновационность (0-10)

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  totalScore: number; // Общая оценка

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date; // Дата завершения экспертизы

  @Column('text', { nullable: true })
  expertComments: string; // Комментарии эксперта

  @Column({ type: 'boolean', default: false })
  isRecommendedForApproval: boolean; // Рекомендуется к одобрению

  // Связи
  @ManyToOne(() => Program, program => program.expertises, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programId' })
  program: Program;

  @Column()
  programId: string;

  @ManyToOne(() => User, { eager: true })
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
