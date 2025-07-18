import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Заглушка для email сервиса - в реальном проекте здесь будет интеграция с почтовым сервисом
@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {}

  async sendInvitationEmail(email: string, invitationToken: string): Promise<void> {
    const baseUrl = this.configService.get('BASE_URL', 'http://localhost:3001');
    const invitationLink = `${baseUrl}/auth/reset-password?token=${invitationToken}`;
    
    // В реальном проекте здесь будет отправка email через SMTP
    console.log(`
=== EMAIL INVITATION ===
To: ${email}
Subject: Приглашение в систему / Смена пароля

Здравствуйте!

Вы приглашены в систему или запросили смену пароля.
Для установки нового пароля перейдите по ссылке:

${invitationLink}

Ссылка действительна в течение 24 часов.

С уважением,
Администрация системы
========================
    `);
  }

  async sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
    console.log(`
=== WELCOME EMAIL ===
To: ${email}
Subject: Добро пожаловать в систему!

Здравствуйте${firstName ? `, ${firstName}` : ''}!

Ваш аккаунт был одобрен администратором.
Теперь вы можете полноценно пользоваться системой.

С уважением,
Администрация системы
=====================
    `);
  }

  async sendInvitationEmailForCandidate(email: string, firstName: string, proposedRoles: string[]): Promise<void> {
    const baseUrl = this.configService.get('BASE_URL', 'http://localhost:3001');
    const registrationLink = `${baseUrl}/auth/register`;
    
    console.log(`
=== CANDIDATE INVITATION EMAIL ===
To: ${email}
Subject: Приглашение в систему ДПП

Здравствуйте, ${firstName}!

Вы приглашены для участия в системе дополнительного профессионального образования в качестве: ${proposedRoles.join(', ')}.

Для регистрации в системе перейдите по ссылке:
${registrationLink}

Используйте этот email (${email}) при регистрации.

С уважением,
Администрация системы
==================================
    `);
  }

  async sendLoginCredentials(email: string, firstName: string, password: string): Promise<void> {
    const baseUrl = this.configService.get('BASE_URL', 'http://localhost:3001');
    const loginLink = `${baseUrl}/auth/login`;
    
    console.log(`
=== LOGIN CREDENTIALS EMAIL ===
To: ${email}
Subject: Ваша заявка одобрена - данные для входа в систему

Здравствуйте, ${firstName}!

Ваша заявка на регистрацию в системе была одобрена администратором.

Данные для входа в систему:
Email: ${email}
Пароль: ${password}

Для входа в систему перейдите по ссылке:
${loginLink}

ВАЖНО: Рекомендуем изменить пароль после первого входа в систему.

С уважением,
Администрация системы
===============================
    `);
  }
}
