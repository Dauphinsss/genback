import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets = new Map<number, string[]>(); // userId -> socketIds[]

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove socket from userSockets map
    for (const [userId, socketIds] of this.userSockets.entries()) {
      const index = socketIds.indexOf(client.id);
      if (index > -1) {
        socketIds.splice(index, 1);
        if (socketIds.length === 0) {
          this.userSockets.delete(userId);
        }
        break;
      }
    }
  }

  registerUserSocket(userId: number, socketId: string) {
    const sockets = this.userSockets.get(userId) || [];
    if (!sockets.includes(socketId)) {
      sockets.push(socketId);
      this.userSockets.set(userId, sockets);
    }
    this.logger.log(`User ${userId} registered with socket ${socketId}`);
  }

  emitNotificationToUser(userId: number, notification: any) {
    const socketIds = this.userSockets.get(userId);
    if (socketIds && socketIds.length > 0) {
      socketIds.forEach((socketId) => {
        this.server.to(socketId).emit('newNotification', notification);
      });
      this.logger.log(`Notification emitted to user ${userId}`);
    } else {
      this.logger.warn(`No active sockets for user ${userId}`);
    }
  }

  emitUnreadCountToUser(userId: number, count: number) {
    const socketIds = this.userSockets.get(userId);
    if (socketIds && socketIds.length > 0) {
      socketIds.forEach((socketId) => {
        this.server.to(socketId).emit('unreadCountUpdate', { count });
      });
      this.logger.log(`Unread count ${count} emitted to user ${userId}`);
    }
  }
}
