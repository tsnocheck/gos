import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class PasswordValidationService {
  
  // A1.2 Валидация пароля согласно требованиям
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Минимум 8 символов
    if (password.length < 8) {
      errors.push('Пароль должен содержать не менее 8 символов');
    }

    // Заглавные буквы
    if (!/[A-ZА-Я]/.test(password)) {
      errors.push('Пароль должен содержать заглавные буквы');
    }

    // Прописные буквы
    if (!/[a-zа-я]/.test(password)) {
      errors.push('Пароль должен содержать прописные буквы');
    }

    // Цифры
    if (!/\d/.test(password)) {
      errors.push('Пароль должен содержать цифры');
    }

    // Специальные символы
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Пароль должен содержать специальные символы');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Проверка совпадения паролей
  validatePasswordConfirmation(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  }

  // Генерация безопасного временного пароля
  generateTemporaryPassword(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    let password = '';
    
    // Обеспечиваем наличие каждого типа символов
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Добавляем остальные символы
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Перемешиваем символы
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}
