import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';

describe('Topics E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    const user = await prisma.user.create({
      data: {
        email: `e2e-topics-${Date.now()}@t.com`,
        name: 'E2E Topics',
        provider: 'test',
        providerId: `test-${Date.now()}`,
      },
    });

    authToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' },
    );
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.topic.deleteMany({}).catch(() => {});
      await prisma.user
        .deleteMany({ where: { provider: 'test' } })
        .catch(() => {});
    }
    if (app) {
      await app.close();
    }
  });

  it('POST /topics crea un topic con jsonFileUrl', async () => {
    const topicDto = {
      name: 'Test Topic',
      type: 'content',
    };
    // Crea el topic
    const res = await request(app.getHttpServer())
      .post('/topics')
      .set('Authorization', `Bearer ${authToken}`)
      .send(topicDto)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name', 'Test Topic');
    expect(res.body).toHaveProperty('type', 'content');
  });
});
