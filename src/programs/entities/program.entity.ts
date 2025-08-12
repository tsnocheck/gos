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

  @Column({ nullable: true })
  fileName: string; // Оригинальное имя файла

  @Column({ nullable: true })
  filePath: string; // Путь к файлу на диске

  @Column({ nullable: true })
  fileSize: number; // Размер файла в байтах

  @Column({ nullable: true })
  mimeType: string; // MIME тип файла

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
  author1Id: string; // ID первого соавтора

  @Column({ nullable: true })
  author2Id: string; // ID второго соавтора

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'author1Id' })
  author1: User; // Первый соавтор

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'author2Id' })
  author2: User; // Второй соавтор

  // Изменения для поддержки создания программы
  @Column({ nullable: true })
  institution: string; // Учреждение

  @Column({ nullable: true })
  customInstitution: string; // Кастомное учреждение

  @Column('json', { nullable: true })
  abbreviations: any[]; // Список сокращений

  @Column('text', { nullable: true })
  relevance: string; // Актуальность

  @Column('text', { nullable: true })
  goal: string; // Цель

  @Column({ nullable: true })
  standard: string; // Стандарт

  @Column('json', { nullable: true })
  functions: string[]; // Трудовые функции

  @Column('json', { nullable: true })
  actions: string[]; // Трудовые действия

  @Column('json', { nullable: true })
  duties: string[]; // Должностные обязанности

  @Column('text', { nullable: true })
  know: string; // Что должен знать

  @Column('text', { nullable: true })
  can: string; // Что должен уметь

  @Column({ nullable: true })
  category: string; // Категория слушателей

  @Column({ nullable: true })
  educationForm: string; // Форма обучения

  @Column({ type: 'int', nullable: true })
  term: number; // Срок освоения

  @Column('json', { nullable: true })
  modules: any[]; // Модули программы

  @Column('json', { nullable: true })
  attestations: any[]; // Аттестации

  @Column('json', { nullable: true })
  topics: any[]; // Темы

  @Column('json', { nullable: true })
  network: any[]; // Сетевые организации

  @Column({ type: 'boolean', default: false })
  networkEnabled: boolean; // Сетевая форма

  @Column('json', { nullable: true })
  lectureModule: any; // Содержание лекционных занятий

  @Column('json', { nullable: true })
  practiceModule: any; // Содержание практических занятий

  @Column('json', { nullable: true })
  distantModule: any; // Содержание дистанционного обучения

  @Column('json', { nullable: true })
  orgPedConditions: any; // Организационно-педагогические условия

  @Column({ nullable: true })
  approvedById: string;

  @OneToMany('Expertise', 'program')
  expertises: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
