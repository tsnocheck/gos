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

export enum RecommendationStatus {
  ACTIVE = 'active',       // Активная
  INACTIVE = 'inactive',   // Неактивная
  RESOLVED = 'resolved',   // Выполнена
  ARCHIVED = 'archived',   // Архивирована
}

@Entity('recommendations')
export class Recommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string; // Заголовок рекомендации

  @Column('text')
  content: string; // Содержание рекомендации

  @Column({ nullable: true })
  type: string; // Тип рекомендации (строка)

  @Column({
    type: 'enum',
    enum: RecommendationStatus,
    default: RecommendationStatus.ACTIVE,
  })
  status: RecommendationStatus;

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
