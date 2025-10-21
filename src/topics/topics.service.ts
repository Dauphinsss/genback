import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTopicDto, UpdateTopicDto } from './dto/topic.dto';
import { GCSContentService } from '../content/gcs-content.service';

@Injectable()
export class TopicsService {
  constructor(
    private prisma: PrismaService,
    private gcsService: GCSContentService,
  ) {}

  /**
   * Crear un nuevo topic
   */
  async createTopic(createTopicDto: CreateTopicDto) {
    return this.prisma.topic.create({
      data: {
        name: createTopicDto.name,
        type: createTopicDto.type || 'content',
      },
      include: {
        content: true,
        lessonTopics: true,
      },
    });
  }

  async getAllTopics() {
    const topics = await this.prisma.topic.findMany({
      include: {
        content: {
          include: {
            resources: true,
          },
        },
        lessonTopics: {
          include: {
            lesson: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      topics.map(async (topic) => {
        if (topic.content?.htmlFileUrl) {
          const htmlContent = await this.gcsService.downloadHtmlFile(
            topic.content.htmlFileUrl,
          );
          return {
            ...topic,
            content: {
              ...topic.content,
              htmlContent,
            },
          };
        }
        return topic;
      }),
    );
  }

  async getTopicById(id: number) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: {
        content: {
          include: {
            resources: true,
          },
        },
        lessonTopics: {
          include: {
            lesson: true,
          },
        },
      },
    });

    if (topic?.content?.htmlFileUrl) {
      const htmlContent = await this.gcsService.downloadHtmlFile(
        topic.content.htmlFileUrl,
      );
      return {
        ...topic,
        content: {
          ...topic.content,
          htmlContent,
        },
      };
    }

    return topic;
  }

  /**
   * Actualizar un topic
   */
  async updateTopic(id: number, updateTopicDto: UpdateTopicDto) {
    return this.prisma.topic.update({
      where: { id },
      data: updateTopicDto,
      include: {
        content: {
          include: {
            resources: true,
          },
        },
        lessonTopics: {
          include: {
            lesson: true,
          },
        },
      },
    });
  }

  async deleteTopic(id: number) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: { content: true },
    });

    if (topic?.content?.htmlFileUrl) {
      await this.gcsService.deleteFile(topic.content.htmlFileUrl);
    }

    return this.prisma.topic.delete({
      where: { id },
    });
  }

  async getTopicsByType(type: string) {
    const topics = await this.prisma.topic.findMany({
      where: { type: type as 'content' | 'evaluation' },
      include: {
        content: {
          include: {
            resources: true,
          },
        },
        lessonTopics: {
          include: {
            lesson: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      topics.map(async (topic) => {
        if (topic.content?.htmlFileUrl) {
          const htmlContent = await this.gcsService.downloadHtmlFile(
            topic.content.htmlFileUrl,
          );
          return {
            ...topic,
            content: {
              ...topic.content,
              htmlContent,
            },
          };
        }
        return topic;
      }),
    );
  }
}
