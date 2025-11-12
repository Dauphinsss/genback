import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let gateway: NotificationsGateway;

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    privilege: {
      findFirst: jest.fn(),
    },
    userPrivilege: {
      findMany: jest.fn(),
    },
  };

  const mockNotificationsGateway = {
    registerUserSocket: jest.fn(),
    emitNotificationToUser: jest.fn(),
    emitUnreadCountToUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationsGateway,
          useValue: mockNotificationsGateway,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTopicCreatedNotification', () => {
    it('should create notifications for all users with create_topics privilege', async () => {
      const userId = 1;
      const topicId = 10;
      const topicName = 'Introduction to TypeScript';

      // Mock privilege lookup
      mockPrismaService.privilege.findFirst.mockResolvedValue({
        id: 1,
        name: 'create_topics',
        description: 'Can create topics',
        category: 'admin',
      });

      // Mock users with privilege
      mockPrismaService.userPrivilege.findMany.mockResolvedValue([
        { userId: 1 },
        { userId: 2 },
      ]);

      const expectedNotification = {
        id: 1,
        userId: 1,
        topicId,
        action: 'created',
        message: `Topic "${topicName}" has been created`,
        isRead: false,
        createdAt: new Date(),
      };

      mockPrismaService.notification.create.mockResolvedValue(
        expectedNotification,
      );
      mockPrismaService.notification.count.mockResolvedValue(1);

      const result = await service.createTopicCreatedNotification(
        userId,
        topicId,
        topicName,
      );

      expect(mockPrismaService.privilege.findFirst).toHaveBeenCalledWith({
        where: { name: 'create_topics' },
      });
      expect(mockPrismaService.userPrivilege.findMany).toHaveBeenCalledWith({
        where: { privilegeId: 1 },
        select: { userId: true },
      });
      expect(mockPrismaService.notification.create).toHaveBeenCalledTimes(2);
      expect(gateway.emitNotificationToUser).toHaveBeenCalledTimes(2);
      expect(gateway.emitUnreadCountToUser).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
  });

  describe('createTopicUpdatedNotification', () => {
    it('should create notifications for all users with create_topics privilege', async () => {
      const userId = 2;
      const topicId = 15;
      const topicName = 'Advanced React Patterns';

      // Mock privilege lookup
      mockPrismaService.privilege.findFirst.mockResolvedValue({
        id: 1,
        name: 'create_topics',
        description: 'Can create topics',
        category: 'admin',
      });

      // Mock users with privilege
      mockPrismaService.userPrivilege.findMany.mockResolvedValue([
        { userId: 1 },
        { userId: 2 },
      ]);

      const expectedNotification = {
        id: 2,
        userId: 1,
        topicId,
        action: 'updated',
        message: `Topic "${topicName}" has been updated`,
        isRead: false,
        createdAt: new Date(),
      };

      mockPrismaService.notification.create.mockResolvedValue(
        expectedNotification,
      );
      mockPrismaService.notification.count.mockResolvedValue(1);

      const result = await service.createTopicUpdatedNotification(
        userId,
        topicId,
        topicName,
      );

      expect(mockPrismaService.privilege.findFirst).toHaveBeenCalledWith({
        where: { name: 'create_topics' },
      });
      expect(mockPrismaService.notification.create).toHaveBeenCalledTimes(2);
      expect(gateway.emitNotificationToUser).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
  });

  describe('createTopicDeletedNotification', () => {
    it('should create notifications for all users with create_topics privilege', async () => {
      const userId = 3;
      const topicId = 20;
      const topicName = 'Database Design';

      // Mock privilege lookup
      mockPrismaService.privilege.findFirst.mockResolvedValue({
        id: 1,
        name: 'create_topics',
        description: 'Can create topics',
        category: 'admin',
      });

      // Mock users with privilege
      mockPrismaService.userPrivilege.findMany.mockResolvedValue([
        { userId: 1 },
        { userId: 2 },
      ]);

      const expectedNotification = {
        id: 3,
        userId: 1,
        topicId,
        action: 'deleted',
        message: `Topic "${topicName}" has been deleted`,
        isRead: false,
        createdAt: new Date(),
      };

      mockPrismaService.notification.create.mockResolvedValue(
        expectedNotification,
      );
      mockPrismaService.notification.count.mockResolvedValue(1);

      const result = await service.createTopicDeletedNotification(
        userId,
        topicId,
        topicName,
      );

      expect(mockPrismaService.privilege.findFirst).toHaveBeenCalledWith({
        where: { name: 'create_topics' },
      });
      expect(mockPrismaService.notification.create).toHaveBeenCalledTimes(2);
      expect(gateway.emitNotificationToUser).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
  });

  describe('getUserNotifications', () => {
    it('should return all notifications for a user ordered by createdAt desc', async () => {
      const userId = 1;
      const mockNotifications = [
        {
          id: 3,
          userId,
          topicId: 30,
          action: 'updated',
          message: 'Topic "Test" has been updated',
          isRead: false,
          createdAt: new Date('2025-01-15'),
        },
        {
          id: 2,
          userId,
          topicId: 20,
          action: 'created',
          message: 'Topic "Example" has been created',
          isRead: true,
          createdAt: new Date('2025-01-14'),
        },
        {
          id: 1,
          userId,
          topicId: 10,
          action: 'deleted',
          message: 'Topic "Old" has been deleted',
          isRead: true,
          createdAt: new Date('2025-01-13'),
        },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(
        mockNotifications,
      );

      const result = await service.getUserNotifications(userId);

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockNotifications);
      expect(result).toHaveLength(3);
      expect(result[0].createdAt.getTime()).toBeGreaterThan(
        result[1].createdAt.getTime(),
      );
    });

    it('should return empty array when user has no notifications', async () => {
      const userId = 999;
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      const result = await service.getUserNotifications(userId);

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([]);
    });
  });

  describe('getUnreadNotifications', () => {
    it('should return only unread notifications for a user', async () => {
      const userId = 2;
      const mockUnreadNotifications = [
        {
          id: 5,
          userId,
          topicId: 50,
          action: 'created',
          message: 'Topic "New Feature" has been created',
          isRead: false,
          createdAt: new Date('2025-01-16'),
        },
        {
          id: 4,
          userId,
          topicId: 40,
          action: 'updated',
          message: 'Topic "Bug Fix" has been updated',
          isRead: false,
          createdAt: new Date('2025-01-15'),
        },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(
        mockUnreadNotifications,
      );

      const result = await service.getUnreadNotifications(userId);

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId, isRead: false },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockUnreadNotifications);
      expect(result.every((n) => !n.isRead)).toBe(true);
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark a notification as read', async () => {
      const notificationId = 5;
      const updatedNotification = {
        id: notificationId,
        userId: 1,
        topicId: 25,
        action: 'updated',
        message: 'Topic "Test" has been updated',
        isRead: true,
        createdAt: new Date(),
      };

      mockPrismaService.notification.update.mockResolvedValue(
        updatedNotification,
      );
      mockPrismaService.notification.count.mockResolvedValue(0);

      const result = await service.markNotificationAsRead(notificationId);

      expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
        where: { id: notificationId },
        data: { isRead: true },
      });
      expect(gateway.emitUnreadCountToUser).toHaveBeenCalledWith(1, 0);
      expect(result).toEqual(updatedNotification);
      expect(result.isRead).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      const userId = 3;
      const updateResult = { count: 5 };

      mockPrismaService.notification.updateMany.mockResolvedValue(updateResult);

      const result = await service.markAllAsRead(userId);

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      expect(gateway.emitUnreadCountToUser).toHaveBeenCalledWith(userId, 0);
      expect(result).toEqual(updateResult);
      expect(result.count).toBe(5);
    });

    it('should return count 0 when user has no unread notifications', async () => {
      const userId = 4;
      const updateResult = { count: 0 };

      mockPrismaService.notification.updateMany.mockResolvedValue(updateResult);

      const result = await service.markAllAsRead(userId);

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      expect(gateway.emitUnreadCountToUser).toHaveBeenCalledWith(userId, 0);
      expect(result.count).toBe(0);
    });
  });

  describe('getUnreadCount', () => {
    it('should return the count of unread notifications for a user', async () => {
      const userId = 1;
      mockPrismaService.notification.count.mockResolvedValue(7);

      const result = await service.getUnreadCount(userId);

      expect(mockPrismaService.notification.count).toHaveBeenCalledWith({
        where: { userId, isRead: false },
      });
      expect(result).toBe(7);
    });

    it('should return 0 when user has no unread notifications', async () => {
      const userId = 2;
      mockPrismaService.notification.count.mockResolvedValue(0);

      const result = await service.getUnreadCount(userId);

      expect(mockPrismaService.notification.count).toHaveBeenCalledWith({
        where: { userId, isRead: false },
      });
      expect(result).toBe(0);
    });
  });
});
