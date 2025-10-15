import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GCSContentService } from './gcs-content.service';

@Injectable()
export class ResourceService {
  constructor(
    private prisma: PrismaService,
    private gcsService: GCSContentService,
  ) {}

  async uploadResource(file: Express.Multer.File, contentId: number) {
    // Validar que el content existe
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content no encontrado');
    }

    // Subir a Google Cloud Storage
    const resourceUrl = await this.gcsService.uploadFile(file, contentId);

    // Determinar tipo de recurso
    const resourceType = this.getResourceType(file.mimetype);

    // Guardar en base de datos
    const resource = await this.prisma.resource.create({
      data: {
        filename: file.originalname,
        resourceUrl,
        type: resourceType as
          | 'IMAGE'
          | 'VIDEO'
          | 'AUDIO'
          | 'DOCUMENT'
          | 'OTHER',
        size: file.size,
        mimeType: file.mimetype,
        contentId,
      },
    });

    return resource;
  }

  async getResourcesByContentId(contentId: number) {
    return this.prisma.resource.findMany({
      where: { contentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteResource(resourceId: number) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new NotFoundException('Resource no encontrado');
    }

    // Eliminar de Google Cloud Storage
    await this.gcsService.deleteFile(resource.resourceUrl);

    // Eliminar de base de datos
    return this.prisma.resource.delete({
      where: { id: resourceId },
    });
  }

  private getResourceType(mimetype: string): string {
    if (mimetype.startsWith('image/')) return 'IMAGE';
    if (mimetype.startsWith('video/')) return 'VIDEO';
    if (mimetype.startsWith('audio/')) return 'AUDIO';
    if (mimetype.includes('pdf') || mimetype.includes('document'))
      return 'DOCUMENT';
    return 'OTHER';
  }
}
