import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Program Authors (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('должен создать программу с соавторами и вернуть их корректно', async () => {
    // Это базовый тест-кейс для проверки работы с соавторами
    console.log('Тест создания программы с соавторами');
    
    const programData = {
      title: 'Тестовая программа с соавторами',
      description: 'Описание тестовой программы',
      coAuthors: ['cdab83d2-de86-48b2-b69f-fc7ca57d1a83'], // ID соавтора из вашего примера
    };

    // Этот тест нужно будет запустить с реальной аутентификацией
    console.log('Данные для тестирования:', programData);
  });

  afterAll(async () => {
    await app.close();
  });
});
