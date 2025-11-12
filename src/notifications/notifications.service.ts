import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
  ) {}

  async createTopicCreatedNotification(
    userId: number,
    topicId: number,
    topicName: string,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        topicId,
        action: 'created',
        message: `Topic "${topicName}" has been created`,
        isRead: false,
      },
    });

    // Emit real-time notification
    this.notificationsGateway.emitNotificationToUser(userId, notification);

    // Update unread count
    const count = await this.getUnreadCount(userId);
    this.notificationsGateway.emitUnreadCountToUser(userId, count);

    return notification;
  }

  async createTopicUpdatedNotification(
    userId: number,
    topicId: number,
    topicName: string,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        topicId,
        action: 'updated',
        message: `Topic "${topicName}" has been updated`,
        isRead: false,
      },
    });

    // Emit real-time notification
    this.notificationsGateway.emitNotificationToUser(userId, notification);

    // Update unread count
    const count = await this.getUnreadCount(userId);
    this.notificationsGateway.emitUnreadCountToUser(userId, count);

    return notification;
  }

  async createTopicDeletedNotification(
    userId: number,
    topicId: number,
    topicName: string,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        topicId,
        action: 'deleted',
        message: `Topic "${topicName}" has been deleted`,
        isRead: false,
      },
    });

    // Emit real-time notification
    this.notificationsGateway.emitNotificationToUser(userId, notification);

    // Update unread count
    const count = await this.getUnreadCount(userId);
    this.notificationsGateway.emitUnreadCountToUser(userId, count);

    return notification;
  }

  async getUserNotifications(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUnreadNotifications(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markNotificationAsRead(notificationId: number) {
    const notification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    // Update unread count for the user
    const count = await this.getUnreadCount(notification.userId);
    this.notificationsGateway.emitUnreadCountToUser(notification.userId, count);

    return notification;
  }

  async markAllAsRead(userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    // Update unread count (should be 0 now)
    this.notificationsGateway.emitUnreadCountToUser(userId, 0);

    return result;
  }

  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}
