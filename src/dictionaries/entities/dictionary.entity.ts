import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { DictionaryType, DictionaryStatus } from '../enums/dictionary.enum';

@Entity('dictionaries')
export class Dictionary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: DictionaryType,
  })
  type: DictionaryType;

  @Column()
  value: string; // Значение справочника

  @Column({ nullable: true })
  description: string; // Описание значения

  @Column({ default: 0 })
  sortOrder: number; // Порядок сортировки

  @Column({
    type: 'enum',
    enum: DictionaryStatus,
    default: DictionaryStatus.ACTIVE,
  })
  status: DictionaryStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  fullName: string; // Полное название (для учреждений)

  @Column({ nullable: true })
  parentId: string; // Связь с родительским элементом (например, трудовые действия -> трудовые функции)

  @Column('json', { nullable: true })
  metadata: any; // Дополнительные данные в JSON формате
}
