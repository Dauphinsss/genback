import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { AuthGuard } from '@nestjs/passport';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @Get('user/:userId')
  async getUserNotifications(@Param('userId') userId: string) {
    return this.notificationsService.getUserNotifications(+userId);
  }

  @Get('user/:userId/unread')
  async getUnreadNotifications(@Param('userId') userId: string) {
    return this.notificationsService.getUnreadNotifications(+userId);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markNotificationAsRead(+id);
  }

  @Patch('user/:userId/read-all')
  async markAllAsRead(@Param('userId') userId: string) {
    return this.notificationsService.markAllAsRead(+userId);
  }

  @Get('user/:userId/unread-count')
  async getUnreadCount(@Param('userId') userId: string) {
    const count = await this.notificationsService.getUnreadCount(+userId);
    return { count };
  }

  @Post('register-socket')
  async registerSocket(@Body() body: { userId: number; socketId: string }) {
    this.notificationsGateway.registerUserSocket(body.userId, body.socketId);
    return { success: true };
  }

  @Get('debug/users-with-privilege')
  async debugUsersWithPrivilege() {
    return this.notificationsService.debugGetUsersWithTopicPrivilege();
  }
}
