import { Test } from '@nestjs/testing';
import { UsersService } from '../../src/users/users.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { before } from 'node:test';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      providers: [UsersService, PrismaService],
    }).compile();

    service = mod.get(UsersService);
    prisma = mod.get(PrismaService);
  });
});