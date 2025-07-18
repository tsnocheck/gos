import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    try {
      console.log('JWT Strategy - validating payload:', payload);
      await this.authService.validateSession(payload.sessionKey);
      
      // Загружаем полного пользователя с ролями
      const user = await this.usersService.findOne(payload.userId);
      console.log('JWT Strategy - found user:', user?.id, user?.email);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      return user;
    } catch (error) {
      console.error('JWT Strategy - validation error:', error.message);
      throw new UnauthorizedException('Invalid session');
    }
  }
}
