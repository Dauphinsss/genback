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
    console.log(
      `[NotificationsService] createTopicCreatedNotification called for topic "${topicName}" (ID: ${topicId}) by user ${userId}`,
    );

    // Get all users with topic management privilege
    const usersWithPrivilege = await this.getUsersWithTopicPrivilege();
    console.log(
      `[NotificationsService] Will create notifications for ${usersWithPrivilege.length} users:`,
      usersWithPrivilege,
    );

    if (usersWithPrivilege.length === 0) {
      console.warn(
        '[NotificationsService] No users with create_topics privilege found! No notifications will be created.',
      );
      return [];
    }

    // Create notifications for all privileged users
    const notifications = await Promise.all(
      usersWithPrivilege.map(async (privilegedUserId) => {
        console.log(
          `[NotificationsService] Creating notification for user ${privilegedUserId}`,
        );
        const notification = await this.prisma.notification.create({
          data: {
            userId: privilegedUserId,
            topicId,
            action: 'created',
            message: `Topic "${topicName}" has been created`,
            isRead: false,
          },
        });
        console.log(
          `[NotificationsService] Notification created:`,
          notification,
        );

        // Emit real-time notification
        try {
          this.notificationsGateway.emitNotificationToUser(
            privilegedUserId,
            notification,
          );

          // Update unread count
          const count = await this.getUnreadCount(privilegedUserId);
          this.notificationsGateway.emitUnreadCountToUser(
            privilegedUserId,
            count,
          );
        } catch (wsError) {
          console.log(
            `[NotificationsService] WebSocket not available (likely in tests):`,
            wsError.message,
          );
        }

        return notification;
      }),
    );

    console.log(
      `[NotificationsService] Total notifications created: ${notifications.length}`,
    );
    return notifications;
  }

  async createTopicUpdatedNotification(
    userId: number,
    topicId: number,
    topicName: string,
  ) {
    // Get all users with topic management privilege
    const usersWithPrivilege = await this.getUsersWithTopicPrivilege();

    // Create notifications for all privileged users
    const notifications = await Promise.all(
      usersWithPrivilege.map(async (privilegedUserId) => {
        const notification = await this.prisma.notification.create({
          data: {
            userId: privilegedUserId,
            topicId,
            action: 'updated',
            message: `Topic "${topicName}" has been updated`,
            isRead: false,
          },
        });

        // Emit real-time notification
        this.notificationsGateway.emitNotificationToUser(
          privilegedUserId,
          notification,
        );

        // Update unread count
        const count = await this.getUnreadCount(privilegedUserId);
        this.notificationsGateway.emitUnreadCountToUser(
          privilegedUserId,
          count,
        );

        return notification;
      }),
    );

    return notifications;
  }

  async createTopicDeletedNotification(
    userId: number,
    topicId: number,
    topicName: string,
  ) {
    // Get all users with topic management privilege
    const usersWithPrivilege = await this.getUsersWithTopicPrivilege();

    // Create notifications for all privileged users
    const notifications = await Promise.all(
      usersWithPrivilege.map(async (privilegedUserId) => {
        const notification = await this.prisma.notification.create({
          data: {
            userId: privilegedUserId,
            topicId,
            action: 'deleted',
            message: `Topic "${topicName}" has been deleted`,
            isRead: false,
          },
        });

        // Emit real-time notification
        this.notificationsGateway.emitNotificationToUser(
          privilegedUserId,
          notification,
        );

        // Update unread count
        const count = await this.getUnreadCount(privilegedUserId);
        this.notificationsGateway.emitUnreadCountToUser(
          privilegedUserId,
          count,
        );

        return notification;
      }),
    );

    return notifications;
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

  private async getUsersWithTopicPrivilege(): Promise<number[]> {
    // Find the privilege for creating/managing topics
    const topicPrivilege = await this.prisma.privilege.findFirst({
      where: {
        name: 'create_topics',
      },
    });

    if (!topicPrivilege) {
      // If no specific privilege found, return empty array
      console.warn('[NotificationsService] No create_topics privilege found');
      return [];
    }

    // Get all users with this privilege
    const userPrivileges = await this.prisma.userPrivilege.findMany({
      where: { privilegeId: topicPrivilege.id },
      select: { userId: true },
    });

    const userIds = userPrivileges.map((up) => up.userId);
    console.log(
      `[NotificationsService] Found ${userIds.length} users with create_topics privilege:`,
      userIds,
    );

    return userIds;
  }

  async debugGetUsersWithTopicPrivilege() {
    // Get all privileges
    const allPrivileges = await this.prisma.privilege.findMany();
    console.log('[DEBUG] All privileges:', allPrivileges);

    // Find the privilege for creating/managing topics
    const topicPrivilege = await this.prisma.privilege.findFirst({
      where: {
        name: 'create_topics',
      },
    });

    console.log('[DEBUG] Topic privilege found:', topicPrivilege);

    if (!topicPrivilege) {
      return {
        error: 'No create_topics privilege found',
        allPrivileges,
      };
    }

    // Get all users with this privilege
    const userPrivileges = await this.prisma.userPrivilege.findMany({
      where: { privilegeId: topicPrivilege.id },
      include: { user: true },
    });

    console.log('[DEBUG] User privileges:', userPrivileges);

    return {
      privilege: topicPrivilege,
      usersCount: userPrivileges.length,
      users: userPrivileges.map((up) => ({
        userId: up.userId,
        userName: up.user.name,
        userEmail: up.user.email,
      })),
      allPrivileges,
    };
  }
}
