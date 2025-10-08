import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrivilegesModule } from './privileges.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('PrivilegesController (e2e)', () => {
  let app: INestApplication;

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrivilegesModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/privileges (GET)', () => {
    it('should return all privileges', () => {
      return request(app.getHttpServer())
        .get('/privileges')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/privileges (POST)', () => {
    it('should create a new privilege', () => {
      const newPrivilege = {
        name: 'test_privilege',
        description: 'Test privilege',
        category: 'admin',
      };

      return request(app.getHttpServer())
        .post('/privileges')
        .send(newPrivilege)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe(newPrivilege.name);
          expect(res.body.description).toBe(newPrivilege.description);
          expect(res.body.category).toBe(newPrivilege.category);
        });
    });
  });
});
