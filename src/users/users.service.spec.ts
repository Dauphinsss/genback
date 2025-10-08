import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsersWithPrivileges', () => {
    it('should return all users with their privileges', async () => {
      const mockUsers = [
        {
          id: 1,
          email: 'user1@test.com',
          name: 'User One',
          avatar: 'avatar1.jpg',
          provider: 'google',
          providerId: '123',
          createdAt: new Date(),
          privileges: [
            {
              id: 1,
              userId: 1,
              privilegeId: 1,
              assignedAt: new Date(),
              privilege: {
                id: 1,
                name: 'manage_users',
                description: 'Manage users',
                category: 'admin',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          ],
        },
        {
          id: 2,
          email: 'user2@test.com',
          name: 'User Two',
          avatar: 'avatar2.jpg',
          provider: 'google',
          providerId: '456',
          createdAt: new Date(),
          privileges: [],
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getAllUsersWithPrivileges();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        name: 'User One',
        email: 'user1@test.com',
        avatar: 'avatar1.jpg',
        privileges: [mockUsers[0].privileges[0].privilege],
      });
      expect(result[1]).toEqual({
        id: 2,
        name: 'User Two',
        email: 'user2@test.com',
        avatar: 'avatar2.jpg',
        privileges: [],
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        include: {
          privileges: {
            include: {
              privilege: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    });

    it('should return empty array when no users exist', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.getAllUsersWithPrivileges();

      expect(result).toEqual([]);
      expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle users with multiple privileges', async () => {
      const mockUsers = [
        {
          id: 1,
          email: 'admin@test.com',
          name: 'Admin User',
          avatar: 'admin.jpg',
          provider: 'google',
          providerId: '789',
          createdAt: new Date(),
          privileges: [
            {
              id: 1,
              userId: 1,
              privilegeId: 1,
              assignedAt: new Date(),
              privilege: {
                id: 1,
                name: 'manage_users',
                description: 'Manage users',
                category: 'admin',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
            {
              id: 2,
              userId: 1,
              privilegeId: 2,
              assignedAt: new Date(),
              privilege: {
                id: 2,
                name: 'manage_privileges',
                description: 'Manage privileges',
                category: 'admin',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
          ],
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getAllUsersWithPrivileges();

      expect(result[0].privileges).toHaveLength(2);
      expect(result[0].privileges[0].name).toBe('manage_users');
      expect(result[0].privileges[1].name).toBe('manage_privileges');
    });
  });

  describe('updateMe', () => {
    it('should update the user name', async () => {
      const userId = 1;

      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.user.update.mockResolvedValue({
        id: userId,
        name: 'Nuevo Nombre',
      });

      const result = await service.updateMe(userId.toString(), {
        name: 'Nuevo Nombre',
      });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { name: 'Nuevo Nombre', avatar: undefined },
      });
      expect(result.name).toBe('Nuevo Nombre');
    });
  });

  describe('updateAvatar', () => {
    it('should update the user avatar', async () => {
      const userId = 1;
      const newAvatarUrl = 'https://cdn/imagen-nueva.jpg';

      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.user.update.mockResolvedValue({
        id: userId,
        avatar: newAvatarUrl,
      });

      const result = await service.updateAvatar(
        userId.toString(),
        newAvatarUrl,
      );

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { avatar: newAvatarUrl },
      });
      expect(result.avatar).toBe(newAvatarUrl);
    });
  });
});
