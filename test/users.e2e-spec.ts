import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

describe('Users E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: number;

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
        email: `test-user-${Date.now()}@test.com`,
        name: 'Test User',
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

  it('GET /users - obtener todos los usuarios', async () => {
    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('GET /api/me - obtener perfil propio', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.id).toBe(testUserId);
    expect(response.body.email).toContain('test-user-');
  });

  it('PATCH /api/me - actualizar nombre', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/me')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Nombre Actualizado' })
      .expect(200);

    expect(response.body.name).toBe('Nombre Actualizado');
  });

  it('PATCH /api/me - actualizar avatar', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/me')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ avatar: 'https://example.com/avatar.jpg' })
      .expect(200);

    expect(response.body.avatar).toBe('https://example.com/avatar.jpg');
  });

  it('GET /users - rechazar sin auth', async () => {
    await request(app.getHttpServer()).get('/users').expect(401);
  });

  it('GET /api/me - rechazar sin auth', async () => {
    await request(app.getHttpServer()).get('/api/me').expect(401);
  });
});
