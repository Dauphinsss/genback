import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTopicDto, UpdateTopicDto } from './dto/topic.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TopicsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async createTopic(createTopicDto: CreateTopicDto, userId: number) {
    const topic = await this.prisma.topic.create({
      data: {
        name: createTopicDto.name,
        type: createTopicDto.type || 'content',
      },
      include: {
        content: { include: { resources: true } },
        lessonTopics: { include: { lesson: true } },
      },
    });

    // Crear notificación
    await this.notificationsService.createTopicCreatedNotification(
      userId,
      topic.id,
      topic.name,
    );

    return topic;
  }

  async getAllTopics() {
    return this.prisma.topic.findMany({
      include: {
        content: { include: { resources: true } },
        lessonTopics: {
          include: {
            lesson: {
              include: {
                unit: { include: { courseBase: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAvailableTopics() {
    return this.prisma.topic.findMany({
      where: { lessonTopics: { none: {} } },
      include: { content: { include: { resources: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTopicById(id: number) {
    return this.prisma.topic.findUnique({
      where: { id },
      include: {
        content: { include: { resources: true } },
        lessonTopics: {
          include: {
            lesson: {
              include: {
                unit: { include: { courseBase: true } },
              },
            },
          },
        },
      },
    });
  }

  async updateTopic(
    id: number,
    updateTopicDto: UpdateTopicDto,
    userId: number,
  ) {
    const topic = await this.prisma.topic.update({
      where: { id },
      data: updateTopicDto,
      include: {
        content: { include: { resources: true } },
        lessonTopics: { include: { lesson: true } },
      },
    });

    // Crear notificación
    await this.notificationsService.createTopicUpdatedNotification(
      userId,
      topic.id,
      topic.name,
    );

    return topic;
  }

  async deleteTopic(id: number, userId: number) {
    // Obtener el topic antes de eliminarlo para tener el nombre
    const topic = await this.prisma.topic.findUnique({ where: { id } });

    if (topic) {
      // Crear notificación antes de eliminar
      await this.notificationsService.createTopicDeletedNotification(
        userId,
        topic.id,
        topic.name,
      );
    }

    return this.prisma.topic.delete({ where: { id } });
  }

  async getTopicsByType(type: string) {
    return this.prisma.topic.findMany({
      where: { type: type as 'content' | 'evaluation' },
      include: {
        content: { include: { resources: true } },
        lessonTopics: { include: { lesson: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
