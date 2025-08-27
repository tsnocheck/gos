import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { CandidateService } from '../users/services/candidate.service';
import { RedisService } from '../redis/redis.service';
import { UserResponseHelper } from '../users/helpers/user-response.helper';
import { Session } from './entities/session.entity';
import { LoginDto } from './dto/auth.dto';
import { CreateUserDto } from '../users/dto/user.dto';
import { RegisterCandidateDto } from '../users/dto/candidate.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private candidateService: CandidateService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
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

    const sessionData = await this.createSession(user.id);
    
    return {
      ...sessionData,
      user: UserResponseHelper.toUserResponse(user),
    };
  }

  async createSession(userId: string) {
    const sessionKey = uuidv4();
    const payload = { userId, sessionKey };
    
    // Используем конфигурируемые значения для времени жизни токенов
    const accessTokenExpiry = this.configService.get<string>('JWT_ACCESS_EXPIRY', '24h');
    const refreshTokenExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRY', '14d');
    
    const accessToken = this.jwtService.sign(payload, { expiresIn: accessTokenExpiry });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: refreshTokenExpiry });
    
    console.log(`Attempting to cache tokens for user ${userId} with session ${sessionKey}`);
    
    try {
      // Сохраняем токены в Redis
      await this.redisService.setAccessToken(userId, sessionKey, accessToken);
      await this.redisService.setRefreshToken(userId, sessionKey, refreshToken);
      console.log(`Successfully cached tokens for user ${userId}`);
    } catch (error) {
      console.error(`Failed to cache tokens for user ${userId}:`, error);
    }
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // 14 дней для refresh token

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
    // Сначала найдем сессию для получения userId
    const session = await this.sessionRepository.findOne({ where: { sessionKey } });
    
    if (session) {
      // Удаляем токены из Redis
      await this.redisService.deleteTokens(session.userId, sessionKey);
    }
    
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

  async registerCandidate(registerCandidateDto: RegisterCandidateDto) {
    // Проверяем, что пользователь с таким email не существует
    const existingUser = await this.usersService.findByEmail(registerCandidateDto.email);
    if (existingUser) {
      throw new UnauthorizedException('Пользователь с таким email уже зарегистрирован');
    }

    // Создаем заявку кандидата для рассмотрения администратором
    const candidateData = {
      ...registerCandidateDto,
      proposedRoles: ['author'], // Роль по умолчанию для самостоятельной регистрации
      comment: 'Самостоятельная регистрация'
    };

    // Создаем кандидата напрямую (без проверки admin.roles, так как это публичная регистрация)
    const candidate = await this.candidateService.createPublicCandidate(candidateData);

    return {
      message: 'Заявка на регистрацию подана. Ожидайте рассмотрения администратором.',
      candidateId: candidate.id
    };
  }
}
