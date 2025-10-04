import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let svc: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      providers: [UsersService, PrismaService],
    }).compile();
    svc = mod.get(UsersService);
    prisma = mod.get(PrismaService);
  });

  it('actualiza displayName y avatarUrl', async () => {
    const userId = 'u-1';
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: userId } as any);
    const updateSpy = jest.spyOn(prisma.user, 'update').mockResolvedValue({
      id: userId,
      displayName: 'Daniel',
      avatarUrl: 'https://cdn/img.jpg',
    } as any);

    const res = await svc.updateMe(userId, { displayName: 'Daniel', avatarUrl: 'https://cdn/img.jpg' });
    expect(updateSpy).toHaveBeenCalled();
    expect(res.displayName).toBe('Daniel');
  });
});
