import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async createContent(topicId: number, dto: CreateContentDto) {
    return this.prisma.content.create({
      data: {
        topicId,
        blocksJson: dto.blocksJson || null,
        description: dto.description,
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
        resources: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async updateContent(contentId: number, dto: UpdateContentDto) {
    const existing = await this.prisma.content.findUnique({
      where: { id: contentId },
    });
    if (!existing) throw new NotFoundException('Content no encontrado');

    return this.prisma.content.update({
      where: { id: contentId },
      data: {
        blocksJson:
          dto.blocksJson !== undefined ? dto.blocksJson : existing.blocksJson,
        description:
          dto.description !== undefined
            ? dto.description
            : existing.description,
      },
      include: {
        topic: true,
        resources: true,
      },
    });
  }

  async deleteContent(contentId: number) {
    return this.prisma.content.delete({ where: { id: contentId } });
  }

  async getAllContents() {
    return this.prisma.content.findMany({
      include: { topic: true, resources: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
