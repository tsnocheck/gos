import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    console.log(`Setting Redis key: ${key}, TTL: ${ttl}`);
    await this.cacheManager.set(key, value, ttl);
    console.log(`Successfully set Redis key: ${key}`);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    // reset метод может быть недоступен в некоторых версиях cache-manager
    // Реализуем через cast к any или пропускаем
    try {
      await (this.cacheManager as any).reset();
    } catch (error) {
      console.warn('Cache reset method not available');
    }
  }

  // Специальные методы для токенов
  async setAccessToken(userId: string, sessionKey: string, token: string): Promise<void> {
    const key = `access_token:${userId}:${sessionKey}`;
    const ttl = 24 * 60 * 60; // 24 hours in seconds
    console.log(`Setting access token key: ${key}`);
    await this.set(key, token, ttl);
    
    // Тестовая проверка сразу после установки
    const retrieved = await this.get(key);
    console.log(`Retrieved value for ${key}:`, retrieved ? 'EXISTS' : 'NULL');
  }

  async setRefreshToken(userId: string, sessionKey: string, token: string): Promise<void> {
    const key = `refresh_token:${userId}:${sessionKey}`;
    const ttl = 14 * 24 * 60 * 60; // 14 days in seconds
    await this.set(key, token, ttl);
  }

  async getAccessToken(userId: string, sessionKey: string): Promise<string | undefined> {
    const key = `access_token:${userId}:${sessionKey}`;
    return await this.get<string>(key);
  }

  async getRefreshToken(userId: string, sessionKey: string): Promise<string | undefined> {
    const key = `refresh_token:${userId}:${sessionKey}`;
    return await this.get<string>(key);
  }

  async deleteTokens(userId: string, sessionKey: string): Promise<void> {
    await this.del(`access_token:${userId}:${sessionKey}`);
    await this.del(`refresh_token:${userId}:${sessionKey}`);
  }

  async deleteAllUserTokens(userId: string): Promise<void> {
    // Это более сложная операция, которая требует scan всех ключей
    // В продакшене лучше хранить список сессий для каждого пользователя
    console.warn('deleteAllUserTokens не реализован для производственного использования');
  }
}
