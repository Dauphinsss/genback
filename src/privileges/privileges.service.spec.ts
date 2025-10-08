import { Test, TestingModule } from '@nestjs/testing';
import { PrivilegesService } from '../../src/privileges/privileges.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('PrivilegesService', () => {
  let service: PrivilegesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    privilege: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    userPrivilege: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrivilegesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PrivilegesService>(PrivilegesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPrivileges', () => {
    it('should return an array of privileges', async () => {
      const mockPrivileges = [
        {
          id: 1,
          name: 'manage_users',
          description: 'Manage users',
          category: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'manage_privileges',
          description: 'Manage privileges',
          category: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.privilege.findMany.mockResolvedValue(mockPrivileges);

      const result = await service.getPrivileges();

      expect(result).toEqual(mockPrivileges);
      expect(prisma.privilege.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(prisma.privilege.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no privileges exist', async () => {
      mockPrismaService.privilege.findMany.mockResolvedValue([]);

      const result = await service.getPrivileges();

      expect(result).toEqual([]);
      expect(prisma.privilege.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserPrivileges', () => {
    it('should return user privileges', async () => {
      const userId = 1;
      const mockUserPrivileges = [
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
      ];

      mockPrismaService.userPrivilege.findMany.mockResolvedValue(
        mockUserPrivileges,
      );

      const result = await service.getUserPrivileges(userId);

      expect(result).toEqual([mockUserPrivileges[0].privilege]);
      expect(prisma.userPrivilege.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { privilege: true },
      });
    });

    it('should return empty array when user has no privileges', async () => {
      const userId = 2;
      mockPrismaService.userPrivilege.findMany.mockResolvedValue([]);

      const result = await service.getUserPrivileges(userId);

      expect(result).toEqual([]);
    });
  });

  describe('createPrivilege', () => {
    it('should create a new privilege with all fields', async () => {
      const mockPrivilege = {
        id: 1,
        name: 'manage_courses',
        description: 'Manage courses',
        category: 'teacher',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.privilege.create.mockResolvedValue(mockPrivilege);

      const result = await service.createPrivilege(
        'manage_courses',
        'Manage courses',
        'teacher',
      );

      expect(result).toEqual(mockPrivilege);
      expect(prisma.privilege.create).toHaveBeenCalledWith({
        data: {
          name: 'manage_courses',
          description: 'Manage courses',
          category: 'teacher',
        },
      });
    });

    it('should create a privilege with default category when not provided', async () => {
      const mockPrivilege = {
        id: 1,
        name: 'test_privilege',
        description: 'Test',
        category: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.privilege.create.mockResolvedValue(mockPrivilege);

      await service.createPrivilege('test_privilege', 'Test');

      expect(prisma.privilege.create).toHaveBeenCalledWith({
        data: {
          name: 'test_privilege',
          description: 'Test',
          category: 'admin',
        },
      });
    });
  });

  describe('assignPrivilege', () => {
    it('should assign a privilege to a user', async () => {
      const userId = 1;
      const privilegeId = 1;
      const mockAssignment = {
        id: 1,
        userId,
        privilegeId,
        assignedAt: new Date(),
      };

      mockPrismaService.userPrivilege.findFirst.mockResolvedValue(null);
      mockPrismaService.userPrivilege.create.mockResolvedValue(mockAssignment);

      const result = await service.assignPrivilege(userId, privilegeId);

      expect(result).toEqual(mockAssignment);
      expect(prisma.userPrivilege.findFirst).toHaveBeenCalledWith({
        where: { userId, privilegeId },
      });
      expect(prisma.userPrivilege.create).toHaveBeenCalledWith({
        data: { userId, privilegeId },
      });
    });

    it('should return existing assignment if already exists', async () => {
      const userId = 1;
      const privilegeId = 1;
      const existingAssignment = {
        id: 1,
        userId,
        privilegeId,
        assignedAt: new Date(),
      };

      mockPrismaService.userPrivilege.findFirst.mockResolvedValue(
        existingAssignment,
      );

      const result = await service.assignPrivilege(userId, privilegeId);

      expect(result).toEqual(existingAssignment);
      expect(prisma.userPrivilege.create).not.toHaveBeenCalled();
    });
  });

  describe('removePrivilege', () => {
    it('should remove a privilege from a user', async () => {
      const userId = 1;
      const privilegeId = 1;

      mockPrismaService.userPrivilege.deleteMany.mockResolvedValue({
        count: 1,
      });

      const result = await service.removePrivilege(userId, privilegeId);

      expect(result).toEqual({ count: 1 });
      expect(prisma.userPrivilege.deleteMany).toHaveBeenCalledWith({
        where: { userId, privilegeId },
      });
    });
  });

  describe('deletePrivilege', () => {
    it('should delete a privilege and all its assignments', async () => {
      const privilegeId = 1;
      const mockPrivilege = {
        id: privilegeId,
        name: 'test_privilege',
        description: 'Test',
        category: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.userPrivilege.deleteMany.mockResolvedValue({
        count: 2,
      });
      mockPrismaService.privilege.delete.mockResolvedValue(mockPrivilege);

      const result = await service.deletePrivilege(privilegeId);

      expect(result).toEqual(mockPrivilege);
      expect(prisma.userPrivilege.deleteMany).toHaveBeenCalledWith({
        where: { privilegeId },
      });
      expect(prisma.privilege.delete).toHaveBeenCalledWith({
        where: { id: privilegeId },
      });
    });
  });
});
