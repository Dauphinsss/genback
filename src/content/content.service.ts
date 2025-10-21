import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto';
import { GCSContentService } from './gcs-content.service';

@Injectable()
export class ContentService {
  constructor(
    private prisma: PrismaService,
    private gcsService: GCSContentService,
  ) {}

  async createContent(topicId: number, createContentDto: CreateContentDto) {
    let htmlFileUrl: string | undefined;

    // Si hay contenido HTML, subirlo a GCS
    if (createContentDto.htmlContent) {
      htmlFileUrl = await this.gcsService.uploadHtmlFile(
        createContentDto.htmlContent,
        topicId,
      );
    }

    return this.prisma.content.create({
      data: {
        topicId,
        htmlFileUrl,
        description: createContentDto.description,
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
        resources: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Si existe URL de HTML, descargar el contenido
    if (content?.htmlFileUrl) {
      const htmlContent = await this.gcsService.downloadHtmlFile(
        content.htmlFileUrl,
      );
      return {
        ...content,
        htmlContent, // Agregar el HTML descargado
      };
    }

    return content;
  }

  async updateContent(contentId: number, updateContentDto: UpdateContentDto) {
    const existingContent = await this.prisma.content.findUnique({
      where: { id: contentId },
    });

    let htmlFileUrl = existingContent?.htmlFileUrl;

    // Si hay nuevo contenido HTML, actualizarlo en GCS
    if (updateContentDto.htmlContent && existingContent) {
      htmlFileUrl = await this.gcsService.uploadHtmlFile(
        updateContentDto.htmlContent,
        existingContent.topicId,
      );
    }

    return this.prisma.content.update({
      where: { id: contentId },
      data: {
        htmlFileUrl,
        description: updateContentDto.description,
      },
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
