import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createTopicCreatedNotification(
    userId: number,
    topicId: number,
    topicName: string,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        topicId,
        action: 'created',
        message: `Topic "${topicName}" has been created`,
        isRead: false,
      },
    });
  }

  async createTopicUpdatedNotification(
    userId: number,
    topicId: number,
    topicName: string,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        topicId,
        action: 'updated',
        message: `Topic "${topicName}" has been updated`,
        isRead: false,
      },
    });
  }

  async createTopicDeletedNotification(
    userId: number,
    topicId: number,
    topicName: string,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        topicId,
        action: 'deleted',
        message: `Topic "${topicName}" has been deleted`,
        isRead: false,
      },
    });
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
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}
