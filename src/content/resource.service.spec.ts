import { Test, TestingModule } from '@nestjs/testing';
import { ResourceService } from './resource.service';
import { PrismaService } from '../prisma/prisma.service';
import { GCSContentService } from './gcs-content.service';
import { NotFoundException } from '@nestjs/common';

describe('ResourceService', () => {
  let service: ResourceService;

  const mockPrisma = {
    content: { findUnique: jest.fn() },
    resource: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  const gcs = { uploadFile: jest.fn(), deleteFile: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GCSContentService, useValue: gcs },
      ],
    }).compile();

    service = module.get(ResourceService);
    jest.clearAllMocks();
  });

  it('bloquea imágenes con el mensaje nuevo', async () => {
    const contentId = 1;
    mockPrisma.content.findUnique.mockResolvedValue({ id: contentId });

    const file = {
      originalname: 'img.jpg',
      buffer: Buffer.from('x'),
      mimetype: 'image/jpeg',
      size: 100,
    } as Express.Multer.File;

    await expect(service.uploadResource(file, contentId)).rejects.toThrow(
      'No se permite subir imágenes por ahora',
    );
  });

  it('sube video', async () => {
    const contentId = 1;
    mockPrisma.content.findUnique.mockResolvedValue({ id: contentId });

    const file = {
      originalname: 'v.mp4',
      buffer: Buffer.from('x'),
      mimetype: 'video/mp4',
      size: 100,
    } as Express.Multer.File;

    gcs.uploadFile.mockResolvedValue('https://gcs/content/1/v.mp4');
    mockPrisma.resource.create.mockResolvedValue({
      id: 2,
      filename: 'v.mp4',
      resourceUrl: 'https://gcs/content/1/v.mp4',
      type: 'VIDEO',
      size: 100,
      mimeType: 'video/mp4',
      contentId,
      createdAt: new Date(),
    });

    const res = await service.uploadResource(file, contentId);
    expect(res.type).toBe('VIDEO');
  });

  it('lanza NotFound si content no existe', async () => {
    mockPrisma.content.findUnique.mockResolvedValue(null);
    const file = {
      originalname: 'x.pdf',
      buffer: Buffer.from('x'),
      mimetype: 'application/pdf',
      size: 1,
    } as any;

    await expect(service.uploadResource(file, 999)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('lista resources por content', async () => {
    mockPrisma.resource.findMany.mockResolvedValue([]);
    await service.getResourcesByContentId(1);
    expect(mockPrisma.resource.findMany).toHaveBeenCalledWith({
      where: { contentId: 1 },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('elimina resource', async () => {
    const reso = {
      id: 7,
      filename: 'a.pdf',
      resourceUrl: 'https://gcs/a.pdf',
      type: 'DOCUMENT',
      size: 1,
      mimeType: 'application/pdf',
      contentId: 1,
      createdAt: new Date(),
    };
    mockPrisma.resource.findUnique.mockResolvedValue(reso);
    mockPrisma.resource.delete.mockResolvedValue(reso);

    await service.deleteResource(7);

    expect(gcs.deleteFile).toHaveBeenCalledWith('https://gcs/a.pdf');
    expect(mockPrisma.resource.delete).toHaveBeenCalledWith({
      where: { id: 7 },
    });
  });
});
