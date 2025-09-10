import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

describe('Backend Controllers Integration Test', () => {
  let app: INestApplication;
  let authTokenAdmin: string;
  let authTokenExpert: string;
  let authTokenAuthor: string;
  let testUserId: string;
  let testProgramId: string;
  let testExpertiseId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
          synchronize: true,
          logging: false,
        }),
        AppModule,
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

    // Создаем тестовых пользователей и получаем токены
    await setupTestUsers();
  });

  afterAll(async () => {
    await app.close();
  });

  const setupTestUsers = async () => {
    // Создание админа
    const adminUser = {
      email: 'admin@test.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      roles: ['admin'],
    };

    await request(app.getHttpServer())
      .post('/users')
      .send(adminUser);

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminUser.email,
        password: adminUser.password,
      });

    authTokenAdmin = adminLogin.body.access_token;

    // Создание эксперта
    const expertUser = {
      email: 'expert@test.com',
      password: 'password123',
      firstName: 'Expert',
      lastName: 'User',
      roles: ['expert'],
      subjects: ['Математика', 'Физика'],
      academicDegree: 'Кандидат наук',
    };

    const expertResponse = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${authTokenAdmin}`)
      .send(expertUser);

    const expertLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: expertUser.email,
        password: expertUser.password,
      });

    authTokenExpert = expertLogin.body.access_token;

    // Создание автора
    const authorUser = {
      email: 'author@test.com',
      password: 'password123',
      firstName: 'Author',
      lastName: 'User',
      roles: ['author'],
      workplace: 'Test School',
      position: 'Teacher',
    };

    const authorResponse = await request(app.getHttpServer())
      .post('/users')
      .send(authorUser);

    testUserId = authorResponse.body.id;

    const authorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: authorUser.email,
        password: authorUser.password,
      });

    authTokenAuthor = authorLogin.body.access_token;
  };

  describe('App Controller', () => {
    it('/health (GET) - should return health status', async () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('status');
          expect(res.body.status).toBe('ok');
        });
    });
  });

  describe('Auth Controller', () => {
    it('/auth/login (POST) - should login user', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
        })
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
        });
    });

    it('/auth/profile (GET) - should return user profile', async () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('firstName');
        });
    });

    it('/auth/change-password (POST) - should change password', async () => {
      return request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123',
        })
        .expect(200);
    });
  });

  describe('Users Controller', () => {
    it('/users (GET) - should return users list', async () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('/users/:id (GET) - should return specific user', async () => {
      return request(app.getHttpServer())
        .get(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
        });
    });

    it('/users/:id (PATCH) - should update user', async () => {
      return request(app.getHttpServer())
        .patch(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          firstName: 'Updated Name',
        })
        .expect(200);
    });
  });

  describe('Admin Controller', () => {
    it('/admin/users (GET) - should return admin users list', async () => {
      return request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .expect(200);
    });

    it('/admin/dashboard (GET) - should return dashboard data', async () => {
      return request(app.getHttpServer())
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('totalUsers');
          expect(res.body).toHaveProperty('totalPrograms');
        });
    });
  });

  describe('Candidate Controller', () => {
    let candidateId: string;

    it('/candidates (POST) - should create candidate', async () => {
      const candidate = {
        email: 'candidate@test.com',
        firstName: 'Test',
        lastName: 'Candidate',
        organization: 'Test Org',
        position: 'Teacher',
        proposedRoles: ['author'],
      };

      return request(app.getHttpServer())
        .post('/candidates')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send(candidate)
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
          candidateId = res.body.id;
        });
    });

    it('/candidates (GET) - should return candidates list', async () => {
      return request(app.getHttpServer())
        .get('/candidates')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('/candidates/:id/approve (POST) - should approve candidate', async () => {
      if (candidateId) {
        return request(app.getHttpServer())
          .post(`/candidates/${candidateId}/approve`)
          .set('Authorization', `Bearer ${authTokenAdmin}`)
          .expect(200);
      }
    });
  });

  describe('Dictionaries Controller', () => {
    it('/dictionaries (GET) - should return dictionaries', async () => {
      return request(app.getHttpServer())
        .get('/dictionaries')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('/dictionaries (POST) - should create dictionary', async () => {
      const dictionary = {
        type: 'test_type',
        name: 'Test Dictionary',
        value: 'test_value',
        description: 'Test description',
      };

      return request(app.getHttpServer())
        .post('/dictionaries')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send(dictionary)
        .expect(201);
    });
  });

  describe('Programs Controller', () => {
    it('/programs (POST) - should create program', async () => {
      const program = {
        title: 'Test Program',
        programType: 'professional_development',
        targetAudience: 'teachers',
        duration: 36,
        description: 'Test description',
        goals: 'Test goals',
        tasks: 'Test tasks',
        competencies: ['competency1', 'competency2'],
        planResults: 'Test results',
        modules: [
          {
            name: 'Module 1',
            hours: 18,
            topics: [
              {
                name: 'Topic 1',
                hours: 9,
                type: 'lecture',
                content: 'Test content',
              }
            ]
          }
        ],
      };

      return request(app.getHttpServer())
        .post('/programs')
        .set('Authorization', `Bearer ${authTokenAuthor}`)
        .send(program)
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
          testProgramId = res.body.id;
        });
    });

    it('/programs (GET) - should return programs list', async () => {
      return request(app.getHttpServer())
        .get('/programs')
        .set('Authorization', `Bearer ${authTokenAuthor}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('/programs/:id (GET) - should return specific program', async () => {
      if (testProgramId) {
        return request(app.getHttpServer())
          .get(`/programs/${testProgramId}`)
          .set('Authorization', `Bearer ${authTokenAuthor}`)
          .expect(200)
          .expect(res => {
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('title');
          });
      }
    });

    it('/programs/:id (PATCH) - should update program', async () => {
      if (testProgramId) {
        return request(app.getHttpServer())
          .patch(`/programs/${testProgramId}`)
          .set('Authorization', `Bearer ${authTokenAuthor}`)
          .send({
            title: 'Updated Program Title',
          })
          .expect(200);
      }
    });
  });

  describe('Co-authors Controller', () => {
    it('/programs/:programId/co-authors (GET) - should return co-authors', async () => {
      if (testProgramId) {
        return request(app.getHttpServer())
          .get(`/programs/${testProgramId}/co-authors`)
          .set('Authorization', `Bearer ${authTokenAuthor}`)
          .expect(200)
          .expect(res => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      }
    });

    it('/programs/:programId/co-authors (POST) - should add co-author', async () => {
      if (testProgramId) {
        return request(app.getHttpServer())
          .post(`/programs/${testProgramId}/co-authors`)
          .set('Authorization', `Bearer ${authTokenAuthor}`)
          .send({
            userId: testUserId,
          })
          .expect(201);
      }
    });
  });

  describe('Expertise Controller', () => {
    beforeAll(async () => {
      // Создание экспертизы для тестирования
      if (testProgramId) {
        const expertiseResponse = await request(app.getHttpServer())
          .post('/expertise')
          .set('Authorization', `Bearer ${authTokenAdmin}`)
          .send({
            programId: testProgramId,
            expertId: testUserId,
          });
        
        if (expertiseResponse.body?.id) {
          testExpertiseId = expertiseResponse.body.id;
        }
      }
    });

    it('/expertise (GET) - should return expertises list', async () => {
      return request(app.getHttpServer())
        .get('/expertise')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('/expertise/my (GET) - should return expert\'s expertises', async () => {
      return request(app.getHttpServer())
        .get('/expertise/my')
        .set('Authorization', `Bearer ${authTokenExpert}`)
        .expect(200);
    });

    it('/expertise/:id/submit (POST) - should submit expertise', async () => {
      if (testExpertiseId) {
        const submission = {
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
          .post(`/expertise/${testExpertiseId}/submit`)
          .set('Authorization', `Bearer ${authTokenExpert}`)
          .send(submission)
          .expect(200);
      }
    });
  });

  describe('Recommendations Controller', () => {
    let recommendationId: string;

    it('/recommendations (POST) - should create recommendation', async () => {
      const recommendation = {
        title: 'Test Recommendation',
        content: 'Test recommendation content',
        type: 'general',
        assignedToId: testUserId,
      };

      return request(app.getHttpServer())
        .post('/recommendations')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send(recommendation)
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
          recommendationId = res.body.id;
        });
    });

    it('/recommendations (GET) - should return recommendations list', async () => {
      return request(app.getHttpServer())
        .get('/recommendations')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('/recommendations/:id (PATCH) - should update recommendation', async () => {
      if (recommendationId) {
        return request(app.getHttpServer())
          .patch(`/recommendations/${recommendationId}`)
          .set('Authorization', `Bearer ${authTokenAdmin}`)
          .send({
            title: 'Updated Recommendation',
          })
          .expect(200);
      }
    });

    it('/recommendations/statistics (GET) - should return statistics', async () => {
      return request(app.getHttpServer())
        .get('/recommendations/statistics')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('total');
        });
    });
  });

  describe('Error Handling', () => {
    it('should return 401 for unauthorized requests', async () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });

    it('should return 403 for forbidden requests', async () => {
      return request(app.getHttpServer())
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${authTokenAuthor}`)
        .expect(403);
    });

    it('should return 404 for non-existent resources', async () => {
      return request(app.getHttpServer())
        .get('/users/non-existent-id')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .expect(404);
    });

    it('should return 400 for invalid data', async () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          email: 'invalid-email',
          // missing required fields
        })
        .expect(400);
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/health')
          .expect(200)
      );

      return Promise.all(requests);
    });

    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/programs')
        .set('Authorization', `Bearer ${authTokenAuthor}`)
        .expect(200);
        
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });
  });

  describe('Data Validation', () => {
    it('should validate email format', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email-format',
          password: 'password123',
        })
        .expect(400);
    });

    it('should validate required fields', async () => {
      return request(app.getHttpServer())
        .post('/programs')
        .set('Authorization', `Bearer ${authTokenAuthor}`)
        .send({
          // missing required title field
          description: 'Test description',
        })
        .expect(400);
    });

    it('should validate field lengths', async () => {
      return request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          currentPassword: 'newpassword123',
          newPassword: '123', // too short
        })
        .expect(400);
    });
  });
});
