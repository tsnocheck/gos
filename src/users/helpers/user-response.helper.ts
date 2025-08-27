import { User } from '../entities/user.entity';
import { UserResponse, PublicUserResponse } from '../interfaces/user-response.interface';

export class UserResponseHelper {
  /**
   * Преобразует сущность пользователя в безопасный ответ без пароля
   */
  static toUserResponse(user: User): UserResponse {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserResponse;
  }

  /**
   * Преобразует сущность пользователя в публичный ответ с ограниченной информацией
   */
  static toPublicUserResponse(user: User): PublicUserResponse {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      roles: user.roles,
      academicDegree: user.academicDegree,
      workplace: user.workplace,
      department: user.department,
      position: user.position,
    };
  }

  /**
   * Преобразует массив пользователей в безопасные ответы без паролей
   */
  static toUserResponseArray(users: User[]): UserResponse[] {
    return users.map(user => this.toUserResponse(user));
  }

  /**
   * Преобразует массив пользователей в публичные ответы
   */
  static toPublicUserResponseArray(users: User[]): PublicUserResponse[] {
    return users.map(user => this.toPublicUserResponse(user));
  }
}
