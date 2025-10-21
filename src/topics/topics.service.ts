import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTopicDto, UpdateTopicDto } from './dto/topic.dto';

@Injectable()
export class TopicsService {
  constructor(private prisma: PrismaService) {}

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

  /**
   * Obtener todos los topics con sus relaciones
   */
  async getAllTopics() {
    return this.prisma.topic.findMany({
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
  }

  /**
   * Obtener un topic por ID
   */
  async getTopicById(id: number) {
    return this.prisma.topic.findUnique({
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

  /**
   * Eliminar un topic
   */
  async deleteTopic(id: number) {
    return this.prisma.topic.delete({
      where: { id },
    });
  }

  /**
   * Obtener topics por tipo
   */
  async getTopicsByType(type: string) {
    return this.prisma.topic.findMany({
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
  }
}
