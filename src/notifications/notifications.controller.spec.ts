import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockNotificationsService = {
    getUserNotifications: jest.fn(),
    getUnreadNotifications: jest.fn(),
    markNotificationAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    getUnreadCount: jest.fn(),
  };

  const mockNotificationsGateway = {
    registerUserSocket: jest.fn(),
    emitNotificationToUser: jest.fn(),
    emitUnreadCountToUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: NotificationsGateway,
          useValue: mockNotificationsGateway,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserNotifications', () => {
    it('should return all notifications for a user', async () => {
      const userId = 1;
      const mockNotifications = [
        {
          id: 1,
          userId,
          topicId: 10,
          action: 'created',
          message: 'Topic "Test" has been created',
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 2,
          userId,
          topicId: 20,
          action: 'updated',
          message: 'Topic "Example" has been updated',
          isRead: true,
          createdAt: new Date(),
        },
      ];

      mockNotificationsService.getUserNotifications.mockResolvedValue(
        mockNotifications,
      );

      const result = await controller.getUserNotifications(userId.toString());

      expect(service.getUserNotifications).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('getUnreadNotifications', () => {
    it('should return only unread notifications for a user', async () => {
      const userId = 2;
      const mockUnreadNotifications = [
        {
          id: 3,
          userId,
          topicId: 30,
          action: 'created',
          message: 'Topic "New" has been created',
          isRead: false,
          createdAt: new Date(),
        },
      ];

      mockNotificationsService.getUnreadNotifications.mockResolvedValue(
        mockUnreadNotifications,
      );

      const result = await controller.getUnreadNotifications(userId.toString());

      expect(service.getUnreadNotifications).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUnreadNotifications);
      expect(result.every((n) => !n.isRead)).toBe(true);
    });
  });

  describe('markAsRead', () => {
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

      mockNotificationsService.markNotificationAsRead.mockResolvedValue(
        updatedNotification,
      );

      const result = await controller.markAsRead(notificationId.toString());

      expect(service.markNotificationAsRead).toHaveBeenCalledWith(
        notificationId,
      );
      expect(result).toEqual(updatedNotification);
      expect(result.isRead).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      const userId = 3;
      const updateResult = { count: 5 };

      mockNotificationsService.markAllAsRead.mockResolvedValue(updateResult);

      const result = await controller.markAllAsRead(userId.toString());

      expect(service.markAllAsRead).toHaveBeenCalledWith(userId);
      expect(result).toEqual(updateResult);
      expect(result.count).toBe(5);
    });
  });

  describe('getUnreadCount', () => {
    it('should return the count of unread notifications', async () => {
      const userId = 1;
      mockNotificationsService.getUnreadCount.mockResolvedValue(3);

      const result = await controller.getUnreadCount(userId.toString());

      expect(service.getUnreadCount).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ count: 3 });
    });

    it('should return count 0 when user has no unread notifications', async () => {
      const userId = 2;
      mockNotificationsService.getUnreadCount.mockResolvedValue(0);

      const result = await controller.getUnreadCount(userId.toString());

      expect(service.getUnreadCount).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ count: 0 });
    });
  });
});
