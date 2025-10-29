import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../src/prisma/prisma.service';

describe('CourseBase e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const u = await prisma.user.create({
      data: {
        email: `e2e-coursebase-${Date.now()}@t.com`,
        name: 'e2e',
        provider: 'test',
        providerId: `p-${Date.now()}`,
      },
    });
    token = jwt.sign(
      { id: u.id, email: u.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('debe haber exactamente 1 curso activo, 0 o 1 inactivo, y 0 o más históricos', async () => {
    const res = await request(app.getHttpServer())
      .get('/courses')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const cursos = res.body;
    expect(Array.isArray(cursos)).toBe(true);

    const activos = cursos.filter((c) => c.status === 'activo');
    const inactivos = cursos.filter((c) => c.status === 'inactivo');
    const historicos = cursos.filter((c) => c.status === 'historico');

    expect(activos.length).toBe(1);
    expect(inactivos.length).toBeLessThanOrEqual(1);
    expect(historicos.length).toBeGreaterThanOrEqual(0);
  });
});
