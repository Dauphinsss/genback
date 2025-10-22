import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

describe('Topics E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: number;
  let testTopicId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Crear usuario de prueba
    const testUser = await prisma.user.create({
      data: {
        email: `test-topics-${Date.now()}@test.com`,
        name: 'Test User Topics',
        provider: 'test',
        providerId: `test-${Date.now()}`,
      },
    });
    testUserId = testUser.id;

    // Generar token JWT
    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email, name: testUser.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' },
    );
  });

  afterAll(async () => {
    // Limpiar datos
    try {
      if (testTopicId) {
        await prisma.topic.deleteMany({ where: { id: testTopicId } });
      }
      if (testUserId) {
        await prisma.user.deleteMany({ where: { id: testUserId } });
      }
    } catch (error) {
      console.error('Error en limpieza:', error);
    }
    if (app) {
      await app.close();
    }
  });

  it('POST /topics - crear topic', async () => {
    const response = await request(app.getHttpServer())
      .post('/topics')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Topic E2E',
        type: 'content',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Topic E2E');
    testTopicId = response.body.id;
  });

  it('GET /topics - obtener todos', async () => {
    const response = await request(app.getHttpServer())
      .get('/topics')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('GET /topics/:id - obtener por ID', async () => {
    const response = await request(app.getHttpServer())
      .get(`/topics/${testTopicId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.id).toBe(testTopicId);
  });

  it('PATCH /topics/:id - actualizar topic', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/topics/${testTopicId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Topic Actualizado' })
      .expect(200);

    expect(response.body.name).toBe('Topic Actualizado');
  });

  it('DELETE /topics/:id - eliminar topic', async () => {
    await request(app.getHttpServer())
      .delete(`/topics/${testTopicId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    testTopicId = null;
  });

  it('POST /topics - rechazar sin auth', async () => {
    await request(app.getHttpServer())
      .post('/topics')
      .send({ name: 'Sin Auth', type: 'content' })
      .expect(401);
  });
});
