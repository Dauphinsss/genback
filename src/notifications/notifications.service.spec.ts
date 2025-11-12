import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTopicCreatedNotification', () => {
    it('should create a notification when a topic is created', async () => {
      const userId = 1;
      const topicId = 10;
      const topicName = 'Introduction to TypeScript';

      const expectedNotification = {
        id: 1,
        userId,
        topicId,
        action: 'created',
        message: `Topic "${topicName}" has been created`,
        isRead: false,
        createdAt: new Date(),
      };

      mockPrismaService.notification.create.mockResolvedValue(
        expectedNotification,
      );

      const result = await service.createTopicCreatedNotification(
        userId,
        topicId,
        topicName,
      );

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId,
          topicId,
          action: 'created',
          message: `Topic "${topicName}" has been created`,
          isRead: false,
        },
      });
      expect(result).toEqual(expectedNotification);
    });
  });

  describe('createTopicUpdatedNotification', () => {
    it('should create a notification when a topic is updated', async () => {
      const userId = 2;
      const topicId = 15;
      const topicName = 'Advanced React Patterns';

      const expectedNotification = {
        id: 2,
        userId,
        topicId,
        action: 'updated',
        message: `Topic "${topicName}" has been updated`,
        isRead: false,
        createdAt: new Date(),
      };

      mockPrismaService.notification.create.mockResolvedValue(
        expectedNotification,
      );

      const result = await service.createTopicUpdatedNotification(
        userId,
        topicId,
        topicName,
      );

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId,
          topicId,
          action: 'updated',
          message: `Topic "${topicName}" has been updated`,
          isRead: false,
        },
      });
      expect(result).toEqual(expectedNotification);
    });
  });

  describe('createTopicDeletedNotification', () => {
    it('should create a notification when a topic is deleted', async () => {
      const userId = 3;
      const topicId = 20;
      const topicName = 'Database Design';

      const expectedNotification = {
        id: 3,
        userId,
        topicId,
        action: 'deleted',
        message: `Topic "${topicName}" has been deleted`,
        isRead: false,
        createdAt: new Date(),
      };

      mockPrismaService.notification.create.mockResolvedValue(
        expectedNotification,
      );

      const result = await service.createTopicDeletedNotification(
        userId,
        topicId,
        topicName,
      );

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId,
          topicId,
          action: 'deleted',
          message: `Topic "${topicName}" has been deleted`,
          isRead: false,
        },
      });
      expect(result).toEqual(expectedNotification);
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

      const result = await service.markNotificationAsRead(notificationId);

      expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
        where: { id: notificationId },
        data: { isRead: true },
      });
      expect(result).toEqual(updatedNotification);
      expect(result.isRead).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      const userId = 3;
      const updateResult = { count: 5 };

      mockPrismaService.notification.updateMany.mockResolvedValue(
        updateResult,
      );

      const result = await service.markAllAsRead(userId);

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      expect(result).toEqual(updateResult);
      expect(result.count).toBe(5);
    });

    it('should return count 0 when user has no unread notifications', async () => {
      const userId = 4;
      const updateResult = { count: 0 };

      mockPrismaService.notification.updateMany.mockResolvedValue(
        updateResult,
      );

      const result = await service.markAllAsRead(userId);

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
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
