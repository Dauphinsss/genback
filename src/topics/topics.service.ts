import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTopicDto, UpdateTopicDto } from './dto/topic.dto';

@Injectable()
export class TopicsService {
  constructor(private prisma: PrismaService) {}

  async createTopic(createTopicDto: CreateTopicDto) {
    return this.prisma.topic.create({
      data: {
        name: createTopicDto.name,
        type: createTopicDto.type || 'content',
      },
      include: {
        content: { include: { resources: true } },
        lessonTopics: { include: { lesson: true } },
      },
    });
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

  async updateTopic(id: number, updateTopicDto: UpdateTopicDto) {
    return this.prisma.topic.update({
      where: { id },
      data: updateTopicDto,
      include: {
        content: { include: { resources: true } },
        lessonTopics: { include: { lesson: true } },
      },
    });
  }

  async deleteTopic(id: number) {
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
