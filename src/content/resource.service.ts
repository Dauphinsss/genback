import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GCSContentService } from './gcs-content.service';

@Injectable()
export class ResourceService {
  constructor(
    private prisma: PrismaService,
    private gcsService: GCSContentService,
  ) {}

  async uploadResource(file: Express.Multer.File, contentId: number) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
    });
    if (!content) throw new NotFoundException('Content no encontrado');

    // Por ahora bloqueamos imágenes como recursos independientes
    if (file.mimetype.startsWith('image/')) {
      throw new BadRequestException('No se permite subir imágenes por ahora');
    }

    const resourceUrl = await this.gcsService.uploadFile(file, contentId);
    const resourceType = this.getResourceType(file.mimetype);

    return this.prisma.resource.create({
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
    if (!resource) throw new NotFoundException('Resource no encontrado');

    await this.gcsService.deleteFile(resource.resourceUrl);

    return this.prisma.resource.delete({ where: { id: resourceId } });
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
