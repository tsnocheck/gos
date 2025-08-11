import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserRole, UserStatus } from '../../users/enums/user.enum';
import { GetAvailableCoAuthorsDto } from '../dto/program-creation.dto';

@Injectable()
export class CoAuthorsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getAvailableCoAuthors(query: GetAvailableCoAuthorsDto, currentUser: User) {
    // Используем QueryBuilder для всех случаев, чтобы корректно работать с массивом ролей
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.id != :currentUserId', { currentUserId: currentUser.id })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .andWhere("array_to_string(user.roles, ',') LIKE :pattern", { pattern: `%${UserRole.AUTHOR}%` })
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.position',
        'user.workplace'
      ])
      .orderBy('user.lastName', 'ASC')
      .addOrderBy('user.firstName', 'ASC')
      .limit(50);

    // Если есть поисковая строка, добавляем фильтр по имени, фамилии или email
    if (query.search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    return queryBuilder.getMany();
  }
}
