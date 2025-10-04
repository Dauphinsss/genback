import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Profile API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const userId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();

    // mockeamos req.user
    app.use((req, _res, next) => { (req as any).user = { sub: userId }; next(); });

    await app.init();
    prisma = app.get(PrismaService);

    await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId, email: 'daniel@vlab.edu' },
      update: {},
    });
  });

  afterAll(async () => { await app.close(); });

  it('GET /api/me devuelve perfil', async () => {
    const res = await request(app.getHttpServer()).get('/api/me').expect(200);
    expect(res.body.email).toBe('daniel@vlab.edu');
  });

  it('PATCH /api/me actualiza nombre y avatar', async () => {
    const payload = { displayName: 'Daniel', avatarUrl: 'https://cdn/avatar.jpg' };
    const res = await request(app.getHttpServer()).patch('/api/me').send(payload).expect(200);
    expect(res.body.displayName).toBe('Daniel');
    expect(res.body.avatarUrl).toBe('https://cdn/avatar.jpg');
  });
});

