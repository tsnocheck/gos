import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum CandidateStatus {
  PENDING = 'pending',
  INVITED = 'invited',
  REGISTERED = 'registered',
  REJECTED = 'rejected'
}

@Entity('candidates')
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  middleName?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  organization?: string;

  @Column({ nullable: true })
  position?: string;

  @Column({ nullable: true })
  workplace?: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ type: 'simple-array', nullable: true })
  subjects?: string[];

  @Column({ nullable: true })
  academicDegree?: string;

  @Column({ type: 'simple-array' })
  proposedRoles: string[];

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({
    type: 'enum',
    enum: CandidateStatus,
    default: CandidateStatus.PENDING
  })
  status: CandidateStatus;

  @Column({ type: 'uuid', nullable: true })
  invitedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'invitedById' })
  invitedBy?: User;

  @Column({ type: 'uuid', nullable: true })
  registeredUserId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'registeredUserId' })
  registeredUser?: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
