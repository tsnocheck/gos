import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/enums/user.enum';
import { UsersService } from '../../users/users.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Проверяем, что пользователь существует и имеет роли
    if (!user) {
      console.log('RolesGuard: No user found in request');
      return false;
    }

    // Если пользователь уже полностью загружен JWT стратегией, используем его
    if (user.roles && Array.isArray(user.roles)) {
      console.log('RolesGuard: User roles from JWT:', user.roles);
      console.log('RolesGuard: Required roles:', requiredRoles);
      return requiredRoles.some((role) => user.roles.includes(role));
    }

    // Если роли не загружены, загружаем пользователя
    if (!user.userId) {
      console.log('RolesGuard: No userId found');
      return false;
    }

    const fullUser = await this.usersService.findOne(user.userId);
    if (!fullUser || !fullUser.roles) {
      console.log('RolesGuard: Could not load full user or roles');
      return false;
    }

    console.log('RolesGuard: Full user roles:', fullUser.roles);
    return requiredRoles.some((role) => fullUser.roles.includes(role));
  }
}
