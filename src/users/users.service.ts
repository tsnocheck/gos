import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Candidate, CandidateStatus } from './entities/candidate.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserStatus } from './enums/user.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...userData } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    // Автоматически связываем с кандидатом, если он существует
    await this.linkUserToCandidate(savedUser);

    return savedUser;
  }

  // Связывание пользователя с кандидатом
  private async linkUserToCandidate(user: User): Promise<void> {
    try {
      const candidate = await this.candidateRepository.findOne({
        where: { email: user.email }
      });

      if (candidate && candidate.status === CandidateStatus.INVITED) {
        candidate.registeredUserId = user.id;
        candidate.status = CandidateStatus.REGISTERED;
        await this.candidateRepository.save(candidate);
      }
    } catch (error) {
      // Не критично, если связывание не удалось
      console.warn('Failed to link user to candidate:', error.message);
    }
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      // Проверяем, что пользователь активен
      if (user.status !== UserStatus.ACTIVE) {
        return null; // Неактивные пользователи не могут войти
      }
      return user;
    }
    return null;
  }

  async findByInvitationToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({ 
      where: { 
        invitationToken: token,
      } 
    });
  }

  async setPassword(userId: string, newPassword: string): Promise<User> {
    const user = await this.findOne(userId);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    user.password = hashedPassword;
    (user as any).invitationToken = null;
    (user as any).invitationExpiresAt = null;
    
    return this.userRepository.save(user);
  }

  async findActiveUsers(): Promise<User[]> {
    return this.userRepository.find({ 
      where: { status: UserStatus.ACTIVE } 
    });
  }
}
