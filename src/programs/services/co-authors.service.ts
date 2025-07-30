import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Not } from 'typeorm';
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
    const whereConditions: any = {
      id: Not(currentUser.id), // Исключаем текущего пользователя
      status: UserStatus.ACTIVE, // Только активные пользователи
    };

    // Фильтруем только авторов
    whereConditions.roles = UserRole.AUTHOR;

    // Если есть поисковая строка, добавляем фильтр по имени или email
    if (query.search) {
      whereConditions.firstName = ILike(`%${query.search}%`);
      // Можно добавить OR условие для поиска по фамилии или email
      // Но TypeORM не поддерживает простые OR в where объекте
      // Поэтому используем QueryBuilder для более сложных запросов
    }

    if (query.search) {
      return this.userRepository
        .createQueryBuilder('user')
        .where('user.id != :currentUserId', { currentUserId: currentUser.id })
        .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
        .andWhere('user.roles @> :roles', { roles: JSON.stringify([UserRole.AUTHOR]) })
        .andWhere(
          '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
          { search: `%${query.search}%` }
        )
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
        .limit(50) // Ограничиваем количество результатов
        .getMany();
    }

    return this.userRepository.find({
      where: whereConditions,
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'position',
        'workplace'
      ],
      order: {
        lastName: 'ASC',
        firstName: 'ASC',
      },
      take: 50, // Ограничиваем количество результатов
    });
  }
}
