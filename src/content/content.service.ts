import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async createContent(topicId: number, createContentDto: CreateContentDto) {
    return this.prisma.content.create({
      data: {
        topicId,
        htmlContent: createContentDto.htmlContent,
        description: createContentDto.description,
      },
      include: {
        topic: true,
        resources: true,
      },
    });
  }

  async getContentByTopicId(topicId: number) {
    return this.prisma.content.findUnique({
      where: { topicId },
      include: {
        topic: true,
        resources: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async updateContent(contentId: number, updateContentDto: UpdateContentDto) {
    return this.prisma.content.update({
      where: { id: contentId },
      data: updateContentDto,
      include: {
        topic: true,
        resources: true,
      },
    });
  }

  async deleteContent(contentId: number) {
    // Los resources se eliminan automáticamente por la cascada
    return this.prisma.content.delete({
      where: { id: contentId },
    });
  }

  async getAllContents() {
    return this.prisma.content.findMany({
      include: {
        topic: true,
        resources: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
