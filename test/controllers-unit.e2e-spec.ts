import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Import controllers
import { AppController } from '../src/app.controller';
import { AuthController } from '../src/auth/auth.controller';
import { UsersController } from '../src/users/users.controller';
import { ProgramsController } from '../src/programs/controllers/programs.controller';
import { ExpertiseController } from '../src/programs/controllers/expertise.controller';
import { RecommendationsController } from '../src/programs/controllers/recommendations.controller';
import { CoAuthorsController } from '../src/programs/controllers/co-authors.controller';
import { DictionariesController } from '../src/dictionaries/dictionaries.controller';

// Import services (mocked)
import { AppService } from '../src/app.service';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { ProgramsService } from '../src/programs/services/programs.service';
import { ExpertiseService } from '../src/programs/services/expertise.service';
import { RecommendationsService } from '../src/programs/services/recommendations.service';
import { CoAuthorsService } from '../src/programs/services/co-authors.service';
import { DictionariesService } from '../src/dictionaries/dictionaries.service';

describe('Backend Controllers Unit Tests', () => {
  let app: INestApplication;

  // Mock services
  const mockAppService = {
    getHello: jest.fn().mockReturnValue('Hello World!'),
    getHealth: jest.fn().mockReturnValue({ status: 'ok', uptime: process.uptime() }),
  };

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn().mockReturnValue({ access_token: 'test-token', user: { id: '1', email: 'test@test.com' } }),
    changePassword: jest.fn().mockReturnValue(true),
    getUserProfile: jest.fn().mockReturnValue({ id: '1', email: 'test@test.com', firstName: 'Test' }),
  };

  const mockUsersService = {
    findAll: jest.fn().mockReturnValue({ data: [], pagination: { total: 0, page: 1, limit: 10 } }),
    findOne: jest.fn().mockReturnValue({ id: '1', email: 'test@test.com', firstName: 'Test' }),
    create: jest.fn().mockReturnValue({ id: '1', email: 'test@test.com' }),
    update: jest.fn().mockReturnValue({ id: '1', email: 'test@test.com', firstName: 'Updated' }),
    remove: jest.fn().mockReturnValue(true),
  };

  const mockProgramsService = {
    findAll: jest.fn().mockReturnValue({ data: [], pagination: { total: 0, page: 1, limit: 10 } }),
    findOne: jest.fn().mockReturnValue({ id: '1', title: 'Test Program' }),
    create: jest.fn().mockReturnValue({ id: '1', title: 'Test Program' }),
    update: jest.fn().mockReturnValue({ id: '1', title: 'Updated Program' }),
    remove: jest.fn().mockReturnValue(true),
  };

  const mockExpertiseService = {
    findAll: jest.fn().mockReturnValue({ data: [], pagination: { total: 0, page: 1, limit: 10 } }),
    findMyExpertises: jest.fn().mockReturnValue([]),
    submit: jest.fn().mockReturnValue({ id: '1', status: 'completed' }),
  };

  const mockRecommendationsService = {
    findAll: jest.fn().mockReturnValue({ data: [], pagination: { total: 0, page: 1, limit: 10 } }),
    create: jest.fn().mockReturnValue({ id: '1', title: 'Test Recommendation' }),
    update: jest.fn().mockReturnValue({ id: '1', title: 'Updated Recommendation' }),
    getStatistics: jest.fn().mockReturnValue({ total: 0, completed: 0, pending: 0 }),
  };

  const mockCoAuthorsService = {
    findByProgram: jest.fn().mockReturnValue([]),
    addCoAuthor: jest.fn().mockReturnValue({ id: '1', userId: '1', programId: '1' }),
    removeCoAuthor: jest.fn().mockReturnValue(true),
  };

  const mockDictionariesService = {
    findAll: jest.fn().mockReturnValue([]),
    create: jest.fn().mockReturnValue({ id: '1', type: 'test', name: 'Test Dict' }),
    update: jest.fn().mockReturnValue({ id: '1', type: 'test', name: 'Updated Dict' }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        AppController,
        AuthController,
        UsersController,
        ProgramsController,
        ExpertiseController,
        RecommendationsController,
        CoAuthorsController,
        DictionariesController,
      ],
      providers: [
        { provide: AppService, useValue: mockAppService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: ProgramsService, useValue: mockProgramsService },
        { provide: ExpertiseService, useValue: mockExpertiseService },
        { provide: RecommendationsService, useValue: mockRecommendationsService },
        { provide: CoAuthorsService, useValue: mockCoAuthorsService },
        { provide: DictionariesService, useValue: mockDictionariesService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('App Controller', () => {
    it('/health (GET) - should return health status', async () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('status');
          expect(mockAppService.getHealth).toHaveBeenCalled();
        });
    });

    it('/ (GET) - should return Hello World', async () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect(res => {
          expect(mockAppService.getHello).toHaveBeenCalled();
        });
    });
  });

  describe('Auth Controller', () => {
    it('/auth/login (POST) - should validate login data', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@test.com',
          password: 'password123',
        })
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('access_token');
          expect(mockAuthService.login).toHaveBeenCalled();
        });
    });

    it('/auth/login (POST) - should reject invalid email', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('/auth/login (POST) - should reject missing password', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@test.com',
        })
        .expect(400);
    });
  });

  describe('Users Controller', () => {
    it('/users (GET) - should return users list', async () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('data');
          expect(mockUsersService.findAll).toHaveBeenCalled();
        });
    });

    it('/users (POST) - should validate user creation data', async () => {
      const validUser = {
        email: 'newuser@test.com',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/users')
        .send(validUser)
        .expect(201)
        .expect(res => {
          expect(mockUsersService.create).toHaveBeenCalled();
        });
    });

    it('/users (POST) - should reject invalid email', async () => {
      const invalidUser = {
        email: 'invalid-email',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/users')
        .send(invalidUser)
        .expect(400);
    });

    it('/users/:id (GET) - should return specific user', async () => {
      return request(app.getHttpServer())
        .get('/users/1')
        .expect(200)
        .expect(res => {
          expect(mockUsersService.findOne).toHaveBeenCalledWith('1');
        });
    });

    it('/users/:id (PATCH) - should update user', async () => {
      return request(app.getHttpServer())
        .patch('/users/1')
        .send({ firstName: 'Updated' })
        .expect(200)
        .expect(res => {
          expect(mockUsersService.update).toHaveBeenCalledWith('1', { firstName: 'Updated' });
        });
    });
  });

  describe('Programs Controller', () => {
    it('/programs (GET) - should return programs list', async () => {
      return request(app.getHttpServer())
        .get('/programs')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('data');
          expect(mockProgramsService.findAll).toHaveBeenCalled();
        });
    });

    it('/programs (POST) - should validate program creation', async () => {
      const validProgram = {
        title: 'Test Program',
        programType: 'professional_development',
        targetAudience: 'teachers',
        duration: 36,
        description: 'Test description',
        goals: 'Test goals',
        tasks: 'Test tasks',
        competencies: ['competency1'],
        planResults: 'Test results',
        modules: [],
      };

      return request(app.getHttpServer())
        .post('/programs')
        .send(validProgram)
        .expect(201)
        .expect(res => {
          expect(mockProgramsService.create).toHaveBeenCalled();
        });
    });

    it('/programs (POST) - should reject missing title', async () => {
      const invalidProgram = {
        programType: 'professional_development',
        description: 'Test description',
      };

      return request(app.getHttpServer())
        .post('/programs')
        .send(invalidProgram)
        .expect(400);
    });

    it('/programs/:id (GET) - should return specific program', async () => {
      return request(app.getHttpServer())
        .get('/programs/1')
        .expect(200)
        .expect(res => {
          expect(mockProgramsService.findOne).toHaveBeenCalledWith('1');
        });
    });

    it('/programs/:id (PATCH) - should update program', async () => {
      return request(app.getHttpServer())
        .patch('/programs/1')
        .send({ title: 'Updated Program' })
        .expect(200)
        .expect(res => {
          expect(mockProgramsService.update).toHaveBeenCalledWith('1', { title: 'Updated Program' });
        });
    });
  });

  describe('Expertise Controller', () => {
    it('/expertise (GET) - should return expertises list', async () => {
      return request(app.getHttpServer())
        .get('/expertise')
        .expect(200)
        .expect(res => {
          expect(mockExpertiseService.findAll).toHaveBeenCalled();
        });
    });

    it('/expertise/my (GET) - should return expert\'s expertises', async () => {
      return request(app.getHttpServer())
        .get('/expertise/my')
        .expect(200)
        .expect(res => {
          expect(mockExpertiseService.findMyExpertises).toHaveBeenCalled();
        });
    });

    it('/expertise/:id/submit (POST) - should validate expertise submission', async () => {
      const validSubmission = {
        criterion1_1: { value: true, comment: 'Good' },
        criterion1_2: { value: true, comment: 'Excellent' },
        criterion1_3: { value: false, comment: 'Needs improvement' },
        criterion1_4: { value: true, comment: 'Satisfactory' },
        criterion1_5: { value: true, comment: 'Good' },
        criterion2_1: { value: true, comment: 'Well structured' },
        criterion2_2: { value: true, comment: 'Complete' },
        additionalRecommendation: 'Overall good program',
        generalFeedback: 'Program shows potential',
        conclusion: 'Recommended with minor improvements',
      };

      return request(app.getHttpServer())
        .post('/expertise/1/submit')
        .send(validSubmission)
        .expect(200)
        .expect(res => {
          expect(mockExpertiseService.submit).toHaveBeenCalledWith('1', validSubmission);
        });
    });
  });

  describe('Recommendations Controller', () => {
    it('/recommendations (GET) - should return recommendations list', async () => {
      return request(app.getHttpServer())
        .get('/recommendations')
        .expect(200)
        .expect(res => {
          expect(mockRecommendationsService.findAll).toHaveBeenCalled();
        });
    });

    it('/recommendations (POST) - should validate recommendation creation', async () => {
      const validRecommendation = {
        title: 'Test Recommendation',
        content: 'Test content',
        type: 'general',
      };

      return request(app.getHttpServer())
        .post('/recommendations')
        .send(validRecommendation)
        .expect(201)
        .expect(res => {
          expect(mockRecommendationsService.create).toHaveBeenCalled();
        });
    });

    it('/recommendations (POST) - should reject missing title', async () => {
      const invalidRecommendation = {
        content: 'Test content',
      };

      return request(app.getHttpServer())
        .post('/recommendations')
        .send(invalidRecommendation)
        .expect(400);
    });

    it('/recommendations/:id (PATCH) - should update recommendation', async () => {
      return request(app.getHttpServer())
        .patch('/recommendations/1')
        .send({ title: 'Updated Recommendation' })
        .expect(200)
        .expect(res => {
          expect(mockRecommendationsService.update).toHaveBeenCalledWith('1', { title: 'Updated Recommendation' });
        });
    });

    it('/recommendations/statistics (GET) - should return statistics', async () => {
      return request(app.getHttpServer())
        .get('/recommendations/statistics')
        .expect(200)
        .expect(res => {
          expect(mockRecommendationsService.getStatistics).toHaveBeenCalled();
        });
    });
  });

  describe('Co-authors Controller', () => {
    it('/programs/:programId/co-authors (GET) - should return co-authors', async () => {
      return request(app.getHttpServer())
        .get('/programs/1/co-authors')
        .expect(200)
        .expect(res => {
          expect(mockCoAuthorsService.findByProgram).toHaveBeenCalledWith('1');
        });
    });

    it('/programs/:programId/co-authors (POST) - should add co-author', async () => {
      return request(app.getHttpServer())
        .post('/programs/1/co-authors')
        .send({ userId: '2' })
        .expect(201)
        .expect(res => {
          expect(mockCoAuthorsService.addCoAuthor).toHaveBeenCalledWith('1', { userId: '2' });
        });
    });
  });

  describe('Dictionaries Controller', () => {
    it('/dictionaries (GET) - should return dictionaries', async () => {
      return request(app.getHttpServer())
        .get('/dictionaries')
        .expect(200)
        .expect(res => {
          expect(mockDictionariesService.findAll).toHaveBeenCalled();
        });
    });

    it('/dictionaries (POST) - should create dictionary', async () => {
      const validDictionary = {
        type: 'test_type',
        name: 'Test Dictionary',
        value: 'test_value',
      };

      return request(app.getHttpServer())
        .post('/dictionaries')
        .send(validDictionary)
        .expect(201)
        .expect(res => {
          expect(mockDictionariesService.create).toHaveBeenCalled();
        });
    });

    it('/dictionaries (POST) - should reject invalid type', async () => {
      const invalidDictionary = {
        name: 'Test Dictionary',
        value: 'test_value',
      };

      return request(app.getHttpServer())
        .post('/dictionaries')
        .send(invalidDictionary)
        .expect(400);
    });
  });

  describe('Data Validation Tests', () => {
    describe('Email validation', () => {
      it('should accept valid email formats', async () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'firstname+lastname@company.org',
        ];

        for (const email of validEmails) {
          await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email, password: 'password123' })
            .expect(200);
        }
      });

      it('should reject invalid email formats', async () => {
        const invalidEmails = [
          'invalid-email',
          '@domain.com',
          'user@',
          'user..name@domain.com',
        ];

        for (const email of invalidEmails) {
          await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email, password: 'password123' })
            .expect(400);
        }
      });
    });

    describe('Required fields validation', () => {
      it('should enforce required fields for user creation', async () => {
        const incompleteData = [
          { firstName: 'John' }, // missing email, lastName, password
          { email: 'test@test.com' }, // missing firstName, lastName, password
          { email: 'test@test.com', firstName: 'John', lastName: 'Doe' }, // missing password
        ];

        for (const data of incompleteData) {
          await request(app.getHttpServer())
            .post('/users')
            .send(data)
            .expect(400);
        }
      });

      it('should enforce required fields for program creation', async () => {
        const incompleteData = [
          { description: 'Test' }, // missing title
          { title: 'Test Program' }, // missing other required fields
        ];

        for (const data of incompleteData) {
          await request(app.getHttpServer())
            .post('/programs')
            .send(data)
            .expect(400);
        }
      });
    });

    describe('String length validation', () => {
      it('should enforce minimum password length', async () => {
        await request(app.getHttpServer())
          .post('/users')
          .send({
            email: 'test@test.com',
            firstName: 'Test',
            lastName: 'User',
            password: '123', // too short
          })
          .expect(400);
      });

      it('should enforce maximum field lengths', async () => {
        const longString = 'a'.repeat(1000);
        
        await request(app.getHttpServer())
          .post('/users')
          .send({
            email: 'test@test.com',
            firstName: longString, // too long
            lastName: 'User',
            password: 'password123',
          })
          .expect(400);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      return request(app.getHttpServer())
        .post('/users')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should handle large payloads gracefully', async () => {
      const largePayload = {
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
        extraData: 'x'.repeat(100000), // Very large field
      };

      return request(app.getHttpServer())
        .post('/users')
        .send(largePayload)
        .expect(res => {
          expect([400, 413, 413]).toContain(res.status); // Bad request or payload too large
        });
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/health')
          .expect(200)
      );

      const results = await Promise.allSettled(requests);
      const successfulRequests = results.filter(result => result.status === 'fulfilled');
      
      expect(successfulRequests.length).toBe(10);
    });

    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/programs')
        .expect(200);
        
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second for unit tests
    });
  });

  describe('Integration Testing', () => {
    it('should maintain service call order in complex operations', async () => {
      // Test program creation flow
      await request(app.getHttpServer())
        .post('/programs')
        .send({
          title: 'Integration Test Program',
          programType: 'professional_development',
          targetAudience: 'teachers',
          duration: 36,
          description: 'Test description',
          goals: 'Test goals',
          tasks: 'Test tasks',
          competencies: ['competency1'],
          planResults: 'Test results',
          modules: [],
        })
        .expect(201);

      expect(mockProgramsService.create).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors gracefully', async () => {
      // Mock service to throw error
      mockUsersService.findOne.mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });

      await request(app.getHttpServer())
        .get('/users/1')
        .expect(500);
    });
  });
});
