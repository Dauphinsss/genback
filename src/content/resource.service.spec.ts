import { Test, TestingModule } from '@nestjs/testing';
import { ResourceService } from './resource.service';
import { PrismaService } from '../prisma/prisma.service';
import { GCSContentService } from './gcs-content.service';
import { NotFoundException } from '@nestjs/common';

describe('ResourceService', () => {
  let service: ResourceService;

  const mockPrismaService = {
    content: {
      findUnique: jest.fn(),
    },
    resource: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockGCSService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: GCSContentService,
          useValue: mockGCSService,
        },
      ],
    }).compile();

    service = module.get<ResourceService>(ResourceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadResource', () => {
    it('should block image upload with BadRequestException', async () => {
      const contentId = 1;
      const mockFile = {
        originalname: 'test-image.jpg',
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      const mockContent = { id: 1, topicId: 1, htmlFileUrl: 'https://...' };

      mockPrismaService.content.findUnique.mockResolvedValue(mockContent);

      await expect(service.uploadResource(mockFile, contentId)).rejects.toThrow(
        'Las imágenes deben ir embebidas en base64 dentro del HTML',
      );
      
      expect(mockPrismaService.content.findUnique).toHaveBeenCalledWith({
        where: { id: contentId },
      });
      expect(mockGCSService.uploadFile).not.toHaveBeenCalled();
    });

    it('should upload a video resource', async () => {
      const contentId = 1;
      const mockFile = {
        originalname: 'video.mp4',
        buffer: Buffer.from('fake-video-data'),
        mimetype: 'video/mp4',
        size: 5242880, // 5MB
      } as Express.Multer.File;

      const mockContent = { id: 1, topicId: 1 };
      const mockGCSUrl =
        'https://storage.googleapis.com/bucket/content/1/video.mp4';

      mockPrismaService.content.findUnique.mockResolvedValue(mockContent);
      mockGCSService.uploadFile.mockResolvedValue(mockGCSUrl);

      const expectedResource = {
        id: 2,
        filename: 'video.mp4',
        resourceUrl: mockGCSUrl,
        type: 'VIDEO',
        size: 5242880,
        mimeType: 'video/mp4',
        contentId: 1,
        createdAt: new Date(),
      };

      mockPrismaService.resource.create.mockResolvedValue(expectedResource);

      const result = await service.uploadResource(mockFile, contentId);

      expect(result.type).toBe('VIDEO');
    });

    it('should upload an audio resource', async () => {
      const contentId = 1;
      const mockFile = {
        originalname: 'audio.mp3',
        buffer: Buffer.from('fake-audio-data'),
        mimetype: 'audio/mp3',
        size: 2048,
      } as Express.Multer.File;

      const mockContent = { id: 1, topicId: 1 };
      const mockGCSUrl =
        'https://storage.googleapis.com/bucket/content/1/audio.mp3';

      mockPrismaService.content.findUnique.mockResolvedValue(mockContent);
      mockGCSService.uploadFile.mockResolvedValue(mockGCSUrl);

      const expectedResource = {
        id: 3,
        filename: 'audio.mp3',
        resourceUrl: mockGCSUrl,
        type: 'AUDIO',
        size: 2048,
        mimeType: 'audio/mp3',
        contentId: 1,
        createdAt: new Date(),
      };

      mockPrismaService.resource.create.mockResolvedValue(expectedResource);

      const result = await service.uploadResource(mockFile, contentId);

      expect(result.type).toBe('AUDIO');
    });

    it('should upload a PDF document', async () => {
      const contentId = 1;
      const mockFile = {
        originalname: 'document.pdf',
        buffer: Buffer.from('fake-pdf-data'),
        mimetype: 'application/pdf',
        size: 3072,
      } as Express.Multer.File;

      const mockContent = { id: 1, topicId: 1 };
      const mockGCSUrl =
        'https://storage.googleapis.com/bucket/content/1/document.pdf';

      mockPrismaService.content.findUnique.mockResolvedValue(mockContent);
      mockGCSService.uploadFile.mockResolvedValue(mockGCSUrl);

      const expectedResource = {
        id: 4,
        filename: 'document.pdf',
        resourceUrl: mockGCSUrl,
        type: 'DOCUMENT',
        size: 3072,
        mimeType: 'application/pdf',
        contentId: 1,
        createdAt: new Date(),
      };

      mockPrismaService.resource.create.mockResolvedValue(expectedResource);

      const result = await service.uploadResource(mockFile, contentId);

      expect(result.type).toBe('DOCUMENT');
    });

    it('should throw NotFoundException if content does not exist', async () => {
      const contentId = 999;
      const mockFile = {
        originalname: 'test.jpg',
        buffer: Buffer.from('data'),
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      mockPrismaService.content.findUnique.mockResolvedValue(null);

      await expect(service.uploadResource(mockFile, contentId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.uploadResource(mockFile, contentId)).rejects.toThrow(
        'Content no encontrado',
      );
    });
  });

  describe('getResourcesByContentId', () => {
    it('should return resources for a content', async () => {
      const contentId = 1;
      const expectedResources = [
        {
          id: 1,
          filename: 'image1.jpg',
          resourceUrl: 'https://storage.googleapis.com/bucket/image1.jpg',
          type: 'IMAGE',
          size: 1024,
          mimeType: 'image/jpeg',
          contentId: 1,
          createdAt: new Date('2025-01-01'),
        },
        {
          id: 2,
          filename: 'image2.png',
          resourceUrl: 'https://storage.googleapis.com/bucket/image2.png',
          type: 'IMAGE',
          size: 2048,
          mimeType: 'image/png',
          contentId: 1,
          createdAt: new Date('2025-01-02'),
        },
      ];

      mockPrismaService.resource.findMany.mockResolvedValue(expectedResources);

      const result = await service.getResourcesByContentId(contentId);

      expect(mockPrismaService.resource.findMany).toHaveBeenCalledWith({
        where: { contentId },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(expectedResources);
    });
  });

  describe('deleteResource', () => {
    it('should delete a resource', async () => {
      const resourceId = 1;
      const mockResource = {
        id: 1,
        filename: 'image.jpg',
        resourceUrl: 'https://storage.googleapis.com/bucket/image.jpg',
        type: 'IMAGE',
        size: 1024,
        mimeType: 'image/jpeg',
        contentId: 1,
        createdAt: new Date(),
      };

      mockPrismaService.resource.findUnique.mockResolvedValue(mockResource);
      mockGCSService.deleteFile.mockResolvedValue(undefined);
      mockPrismaService.resource.delete.mockResolvedValue(mockResource);

      const result = await service.deleteResource(resourceId);

      expect(mockPrismaService.resource.findUnique).toHaveBeenCalledWith({
        where: { id: resourceId },
      });
      expect(mockGCSService.deleteFile).toHaveBeenCalledWith(
        mockResource.resourceUrl,
      );
      expect(mockPrismaService.resource.delete).toHaveBeenCalledWith({
        where: { id: resourceId },
      });
      expect(result).toEqual(mockResource);
    });

    it('should throw NotFoundException if resource does not exist', async () => {
      const resourceId = 999;
      mockPrismaService.resource.findUnique.mockResolvedValue(null);

      await expect(service.deleteResource(resourceId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteResource(resourceId)).rejects.toThrow(
        'Resource no encontrado',
      );
    });
  });
});
