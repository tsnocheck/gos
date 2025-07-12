import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { Session } from './entities/session.entity';
import { LoginDto } from './dto/auth.dto';
import { CreateUserDto } from '../users/dto/user.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.usersService.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    const user = await this.usersService.create(createUserDto);
    return this.createSession(user.id);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createSession(user.id);
  }

  async createSession(userId: string) {
    const sessionKey = uuidv4();
    const payload = { userId, sessionKey };
    
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Remove old sessions for this user
    await this.sessionRepository.delete({ userId });

    const session = this.sessionRepository.create({
      sessionKey,
      accessToken,
      refreshToken,
      expiresAt,
      userId,
    });

    await this.sessionRepository.save(session);

    return {
      sessionKey,
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  async validateSession(sessionKey: string) {
    const session = await this.sessionRepository.findOne({
      where: { sessionKey },
      relations: ['user'],
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    return session;
  }

  async refreshToken(sessionKey: string) {
    const session = await this.validateSession(sessionKey);
    return this.createSession(session.userId);
  }

  async logout(sessionKey: string) {
    await this.sessionRepository.delete({ sessionKey });
    return { message: 'Logged out successfully' };
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const session = await this.validateSession(payload.sessionKey);
      return { userId: session.userId, sessionKey: payload.sessionKey };
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByInvitationToken(token);
    
    if (!user || !user.invitationExpiresAt || user.invitationExpiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    await this.usersService.setPassword(user.id, newPassword);
    
    // Если пользователь был неактивен, активируем его
    if (user.status === 'inactive') {
      user.status = 'active' as any;
      await this.usersService.update(user.id, user as any);
    }

    return { message: 'Password reset successfully' };
  }
}
