import { Injectable, BadRequestException } from '@nestjs/common';
import { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'programs');

  constructor() {
    // Создаем директорию для загрузок если она не существует
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<{
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
  }> {
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }

    // Проверка размера файла (максимум 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('Размер файла превышает максимально допустимый (10MB)');
    }

    // Проверка типа файла (разрешаем документы)
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Неподдерживаемый тип файла. Разрешены: PDF, DOC, DOCX, XLS, XLSX, TXT');
    }

    // Генерируем уникальное имя файла
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, fileName);

    try {
      // Сохраняем файл на диск
      fs.writeFileSync(filePath, file.buffer);

      return {
        fileName: file.originalname,
        filePath: fileName, // Сохраняем только имя файла, не полный путь
        fileSize: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      throw new BadRequestException('Ошибка при сохранении файла');
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    if (!fileName) return;

    const filePath = path.join(this.uploadDir, fileName);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn('Не удалось удалить файл:', error.message);
    }
  }

  getFilePath(fileName: string): string {
    return path.join(this.uploadDir, fileName);
  }

  fileExists(fileName: string): boolean {
    if (!fileName) return false;
    return fs.existsSync(path.join(this.uploadDir, fileName));
  }
}
