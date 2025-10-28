import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Content E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let topicId: number;
  let contentId: number;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);

    // usuario + token
    const u = await prisma.user.create({
      data: {
        email: `e2e-content-${Date.now()}@t.com`,
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

    // topic base
    const t = await prisma.topic.create({
      data: { name: 'E2E Topic', type: 'content' },
    });
    topicId = t.id;
  });

  afterAll(async () => {
    if (contentId)
      await prisma.content.delete({ where: { id: contentId } }).catch(() => {});
    if (topicId)
      await prisma.topic.delete({ where: { id: topicId } }).catch(() => {});
    await app.close();
  });

  it('POST /content/topic/:topicId crea content (solo description)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/content/topic/${topicId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'intro' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.topicId).toBe(topicId);
    contentId = res.body.id;
  });

  it('GET /content/topic/:topicId devuelve el content', async () => {
    const res = await request(app.getHttpServer())
      .get(`/content/topic/${topicId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('topicId', topicId);
  });
});
