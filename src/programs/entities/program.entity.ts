import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ProgramStatus, ProgramSection } from '../enums/program.enum';

@Entity('programs')
export class Program {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string; // Название программы

  @Column('text', { nullable: true })
  description: string; // Описание программы

  @Column({
    type: 'enum',
    enum: ProgramStatus,
    default: ProgramStatus.DRAFT,
  })
  status: ProgramStatus;

  @Column({ nullable: true })
  programCode: string; // Код программы

  @Column({ type: 'int', nullable: true })
  duration: number; // Продолжительность в часах

  @Column('text', { nullable: true })
  targetAudience: string; // Целевая аудитория

  @Column('text', { nullable: true })
  competencies: string; // Компетенции

  @Column('text', { nullable: true })
  learningOutcomes: string; // Результаты обучения

  @Column('text', { nullable: true })
  content: string; // Содержание программы

  @Column('text', { nullable: true })
  methodology: string; // Методология

  @Column('text', { nullable: true })
  assessment: string; // Оценка результатов

  @Column('text', { nullable: true })
  materials: string; // Учебные материалы

  @Column('text', { nullable: true })
  requirements: string; // Требования к участникам

  // Нормативно-правовой раздел
  @Column('text', { nullable: true })
  nprContent: string;

  // Предметно-методический раздел
  @Column('text', { nullable: true })
  pmrContent: string;

  // Вариативный раздел
  @Column('text', { nullable: true })
  vrContent: string;

  @Column({ type: 'int', default: 1 })
  version: number; // Версия программы

  @Column({ nullable: true })
  parentId: string; // ID родительской версии для версионирования

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date; // Дата отправки на экспертизу

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date; // Дата одобрения

  @Column({ type: 'timestamp', nullable: true })
  archivedAt: Date; // Дата архивирования

  @Column('text', { nullable: true })
  rejectionReason: string; // Причина отклонения

  // Связи
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User;

  @Column({ nullable: true })
  approvedById: string;

  @OneToMany('Expertise', 'program')
  expertises: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
