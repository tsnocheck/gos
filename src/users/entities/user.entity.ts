import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  OneToMany 
} from 'typeorm';
import { Session } from '../../auth/entities/session.entity';
import { UserRole, UserStatus } from '../enums/user.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    array: true,
    default: [UserRole.AUTHOR],
  })
  roles: UserRole[]; // Изменено на массив ролей

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.INACTIVE, // Новые пользователи неактивны до одобрения админом
  })
  status: UserStatus;

  @Column({ nullable: true })
  lastName: string; // Фамилия

  @Column({ nullable: true })
  firstName: string; // Имя

  @Column({ nullable: true })
  middleName: string; // Отчество

  @Column({ nullable: true })
  phone: string; // Телефон

  @Column({ nullable: true })
  position: string; // Должность

  @Column({ nullable: true })
  workplace: string; // Место работы

  @Column({ nullable: true })
  department: string; // Структурное подразделение

  @Column('text', { array: true, nullable: true })
  subjects: string[]; // Преподаваемые предметы

  @Column({ nullable: true })
  academicDegree: string; // Ученая степень

  @Column({ nullable: true })
  invitationToken: string; // Токен для приглашения/смены пароля

  @Column({ nullable: true })
  invitationExpiresAt: Date; // Время истечения приглашения

  @OneToMany(() => Session, session => session.user, { cascade: true })
  sessions: Session[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
