import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async createContent(topicId: number, dto: CreateContentDto) {
    const created = await this.prisma.content.create({
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

    await this.prisma.historicContent.create({
      data: {
        contentId: created.id,
        performedBy: dto.performedBy ?? dto.createdBy ?? 'Desconocido',
        changeSummary: dto.changeSummary ?? 'Creó el contenido',
        snapshotDescription: created.description,
        snapshotBlocksJson: created.blocksJson,
      },
    });

    return created;
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

    const updated = await this.prisma.content.update({
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

    await this.prisma.historicContent.create({
      data: {
        contentId,
        performedBy: dto.updatedBy ?? 'Desconocido',
        changeSummary: dto.changeSummary ?? 'Actualizó el contenido',
        snapshotDescription: updated.description,
        snapshotBlocksJson: updated.blocksJson,
      },
    });

    return updated;
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

  async getContentHistory(contentId: number) {
    return this.prisma.historicContent.findMany({
      where: { contentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async restoreContentVersion(
    historyId: number,
    options: { restoredBy: string; changeSummary?: string },
  ) {
    const historyEntry = await this.prisma.historicContent.findUnique({
      where: { id: historyId },
    });
    if (!historyEntry) {
      throw new NotFoundException('Registro histórico no encontrado');
    }

    const restored = await this.prisma.content.update({
      where: { id: historyEntry.contentId },
      data: {
        blocksJson: historyEntry.snapshotBlocksJson,
        description: historyEntry.snapshotDescription,
      },
      include: { topic: true, resources: true },
    });

    await this.prisma.historicContent.create({
      data: {
        contentId: historyEntry.contentId,
        performedBy: options.restoredBy ?? 'Desconocido',
        changeSummary:
          options.changeSummary ?? 'Restauró una versión anterior',
        snapshotDescription: restored.description,
        snapshotBlocksJson: restored.blocksJson,
      },
    });

    return restored;
  }
}
