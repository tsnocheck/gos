import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Множественные варианты SMTP конфигураций
    const configs = [
      // Новая рабочая конфигурация Wamanga
      {
        name: 'Wamanga SMTP',
        host: 'smtp.wamanga.me',
        port: 587,
        secure: false,
        auth: {
          user: 'support@wamanga.me',
          pass: 'Manrol2004'
        },
        tls: { rejectUnauthorized: false }
      },
      {
        name: 'Wamanga SMTP SSL',
        host: 'smtp.wamanga.me',
        port: 465,
        secure: true,
        auth: {
          user: 'support@wamanga.me',
          pass: 'Manrol2004'
        },
        tls: { rejectUnauthorized: false }
      },
      {
        name: 'Wamanga Mail Server',
        host: 'mail.wamanga.me',
        port: 587,
        secure: false,
        auth: {
          user: 'support@wamanga.me',
          pass: 'Manrol2004'
        },
        tls: { rejectUnauthorized: false }
      },
      // Jino.ru конфигурации как fallback
      {
        name: 'Jino SMTP 587',
        host: 'smtp.jino.ru',
        port: 587,
        secure: false,
        auth: {
          user: 'gos@tsnocheck.ru',
          pass: 'Manrol2004'
        },
        tls: { rejectUnauthorized: false }
      },
      {
        name: 'Jino SMTP 465',
        host: 'smtp.jino.ru',
        port: 465,
        secure: true,
        auth: {
          user: 'gos@tsnocheck.ru',
          pass: 'Manrol2004'
        },
        tls: { rejectUnauthorized: false }
      }
    ];

    // Создаем транспорт с первым вариантом
    this.transporter = nodemailer.createTransport(configs[0]);
    
    // Сохраняем все конфиги для fallback
    (this.transporter as any)._configs = configs;
    (this.transporter as any)._currentConfig = 0;
  }

  private async sendMailWithFallback(mailOptions: any): Promise<void> {
    const configs = (this.transporter as any)._configs;
    let currentConfig = (this.transporter as any)._currentConfig;
    
    for (let attempt = 0; attempt < configs.length; attempt++) {
      try {
        console.log(`Trying SMTP config ${currentConfig + 1}: ${configs[currentConfig].host}:${configs[currentConfig].port}`);
        
        // Создаем новый транспорт с текущей конфигурацией
        const testTransporter = nodemailer.createTransport(configs[currentConfig]);
        
        await testTransporter.sendMail(mailOptions);
        
        // Если успешно, обновляем основной транспорт
        this.transporter = testTransporter;
        (this.transporter as any)._configs = configs;
        (this.transporter as any)._currentConfig = currentConfig;
        
        console.log(`✅ Email sent successfully using config ${currentConfig + 1}`);
        return;
        
      } catch (error) {
        console.log(`❌ Config ${currentConfig + 1} failed:`, error.message);
        
        // Переходим к следующей конфигурации
        currentConfig = (currentConfig + 1) % configs.length;
        
        // Если это была последняя попытка, выбрасываем ошибку
        if (attempt === configs.length - 1) {
          throw error;
        }
      }
    }
  }

  async sendInvitationEmail(email: string, invitationToken: string): Promise<void> {
    const baseUrl = this.configService.get('BASE_URL', 'http://dpo-test-ru.ru');
    const invitationLink = `${baseUrl}/auth/reset-password?token=${invitationToken}`;
    
    const mailOptions = {
      from: 'support@wamanga.me',
      to: email,
      subject: 'Приглашение в систему / Смена пароля',
      html: `
        <h2>Здравствуйте!</h2>
        <p>Вы приглашены в систему или запросили смену пароля.</p>
        <p>Для установки нового пароля перейдите по ссылке:</p>
        <p><a href="${invitationLink}" style="color: #007bff; text-decoration: none;">${invitationLink}</a></p>
        <p><strong>Ссылка действительна в течение 24 часов.</strong></p>
        <br>
        <p>С уважением,<br>Администрация системы</p>
      `
    };

    try {
      await this.sendMailWithFallback(mailOptions);
      console.log(`✅ Email invitation sent to: ${email}`);
    } catch (error) {
      console.error('❌ All SMTP configs failed, falling back to console:', error.message);
      // Fallback to console log
      console.log(`
=== EMAIL INVITATION (FALLBACK) ===
To: ${email}
Subject: Приглашение в систему / Смена пароля

Здравствуйте!

Вы приглашены в систему или запросили смену пароля.
Для установки нового пароля перейдите по ссылке:

${invitationLink}

Ссылка действительна в течение 24 часов.

С уважением,
Администрация системы
===================================
      `);
    }
  }

  async sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
    const mailOptions = {
      from: 'support@wamanga.me',
      to: email,
      subject: 'Добро пожаловать в систему!',
      html: `
        <h2>Здравствуйте${firstName ? `, ${firstName}` : ''}!</h2>
        <p>Ваш аккаунт был одобрен администратором.</p>
        <p>Теперь вы можете полноценно пользоваться системой.</p>
        <br>
        <p>С уважением,<br>Администрация системы</p>
      `
    };

    try {
      await this.sendMailWithFallback(mailOptions);
      console.log(`✅ Welcome email sent to: ${email}`);
    } catch (error) {
      console.error('❌ All SMTP configs failed, falling back to console:', error.message);
      // Fallback to console log
      console.log(`
=== WELCOME EMAIL (FALLBACK) ===
To: ${email}
Subject: Добро пожаловать в систему!

Здравствуйте${firstName ? `, ${firstName}` : ''}!

Ваш аккаунт был одобрен администратором.
Теперь вы можете полноценно пользоваться системой.

С уважением,
Администрация системы
====================================
      `);
    }
  }

  async sendInvitationEmailForCandidate(email: string, firstName: string, proposedRoles: string[]): Promise<void> {
    const baseUrl = this.configService.get('BASE_URL', 'http://dpo-test-ru.ru');
    const registrationLink = `${baseUrl}/auth/register`;
    
    const mailOptions = {
      from: 'support@wamanga.me',
      to: email,
      subject: 'Приглашение в систему ДПП',
      html: `
        <h2>Здравствуйте, ${firstName}!</h2>
        <p>Вы приглашены для участия в системе дополнительного профессионального образования в качестве: <strong>${proposedRoles.join(', ')}</strong>.</p>
        <p>Для регистрации в системе перейдите по ссылке:</p>
        <p><a href="${registrationLink}" style="color: #007bff; text-decoration: none;">${registrationLink}</a></p>
        <p>Используйте этот email (<strong>${email}</strong>) при регистрации.</p>
        <br>
        <p>С уважением,<br>Администрация системы</p>
      `
    };

    try {
      await this.sendMailWithFallback(mailOptions);
      console.log(`✅ Candidate invitation email sent to: ${email}`);
    } catch (error) {
      console.error('❌ All SMTP configs failed, falling back to console:', error.message);
      // Fallback to console log
      console.log(`
=== CANDIDATE INVITATION EMAIL (FALLBACK) ===
To: ${email}
Subject: Приглашение в систему ДПП

Здравствуйте, ${firstName}!

Вы приглашены для участия в системе дополнительного профессионального образования в качестве: ${proposedRoles.join(', ')}.

Для регистрации в системе перейдите по ссылке:
${registrationLink}

Используйте этот email (${email}) при регистрации.

С уважением,
Администрация системы
===============================================
      `);
    }
  }

  async sendLoginCredentials(email: string, firstName: string, password: string): Promise<void> {
    const baseUrl = this.configService.get('BASE_URL', 'http://dpo-test-ru.ru');
    const loginLink = `${baseUrl}/login`;
    
    const mailOptions = {
      from: 'support@wamanga.me',
      to: email,
      subject: 'Ваша заявка одобрена - данные для входа в систему',
      html: `
        <h2>Здравствуйте, ${firstName}!</h2>
        <p>Ваша заявка на регистрацию в системе была одобрена администратором.</p>
        
        <h3>Данные для входа в систему:</h3>
        <p><strong>Email:</strong> ${email}<br>
        <strong>Пароль:</strong> ${password}</p>
        
        <p>Для входа в систему перейдите по ссылке:</p>
        <p><a href="${loginLink}" style="color: #007bff; text-decoration: none;">${loginLink}</a></p>
        
        <p><strong>ВАЖНО:</strong> Рекомендуем изменить пароль после первого входа в систему.</p>
        <br>
        <p>С уважением,<br>Администрация системы</p>
      `
    };

    try {
      await this.sendMailWithFallback(mailOptions);
      console.log(`✅ Login credentials email sent to: ${email}`);
    } catch (error) {
      console.error('❌ All SMTP configs failed, falling back to console:', error.message);
      // Fallback to console log
      console.log(`
=== LOGIN CREDENTIALS EMAIL (FALLBACK) ===
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
============================================
      `);
    }
  }
}
