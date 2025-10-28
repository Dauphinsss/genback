import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GCSContentService } from './gcs-content.service';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto';

@Injectable()
export class ContentService {
  constructor(
    private prisma: PrismaService,
    private gcsService: GCSContentService,
  ) {}

  async createContent(topicId: number, dto: CreateContentDto) {
    let jsonFileUrl: string | undefined;

    if (dto.blocksJson) {
      jsonFileUrl = await this.gcsService.uploadJsonFile(
        dto.blocksJson,
        topicId,
      );
    }

    return this.prisma.content.create({
      data: {
        topicId,
        jsonFileUrl,
        description: dto.description,
      },
      include: {
        topic: true,
        resources: true,
      },
    });
  }

  async getContentByTopicId(topicId: number) {
    const content = await this.prisma.content.findUnique({
      where: { topicId },
      include: {
        topic: true,
        resources: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (content?.jsonFileUrl) {
      const jsonData = await this.gcsService.downloadJsonFile(
        content.jsonFileUrl,
      );
      return { ...content, blocksJson: jsonData };
    }

    return content;
  }

  async updateContent(contentId: number, dto: UpdateContentDto) {
    const existing = await this.prisma.content.findUnique({
      where: { id: contentId },
    });
    if (!existing) throw new NotFoundException('Content no encontrado');

    let jsonFileUrl = existing.jsonFileUrl;

    if (dto.blocksJson) {
      jsonFileUrl = await this.gcsService.uploadJsonFile(
        dto.blocksJson,
        existing.topicId,
      );
    }

    return this.prisma.content.update({
      where: { id: contentId },
      data: {
        jsonFileUrl,
        description: dto.description,
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
