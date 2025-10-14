import { Test, TestingModule } from '@nestjs/testing';
import { ContentService } from './content.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto, UpdateContentDto } from './dto/content.dto';

describe('ContentService', () => {
  let service: ContentService;

  const mockPrismaService = {
    content: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createContent', () => {
    it('should create content for a topic', async () => {
      const topicId = 1;
      const createContentDto: CreateContentDto = {
        htmlContent: '<p>HTML content</p>',
        description: 'Test description',
      };

      const expectedContent = {
        id: 1,
        topicId: 1,
        htmlContent: '<p>HTML content</p>',
        description: 'Test description',
        createdAt: new Date(),
        updatedAt: new Date(),
        topic: { id: 1, name: 'Test Topic', type: 'content' },
        resources: [],
      };

      mockPrismaService.content.create.mockResolvedValue(expectedContent);

      const result = await service.createContent(topicId, createContentDto);

      expect(mockPrismaService.content.create).toHaveBeenCalledWith({
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
      expect(result).toEqual(expectedContent);
    });

    it('should create content with minimal data', async () => {
      const topicId = 2;
      const createContentDto: CreateContentDto = {};

      const expectedContent = {
        id: 2,
        topicId: 2,
        htmlContent: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        topic: { id: 2, name: 'Test Topic 2', type: 'content' },
        resources: [],
      };

      mockPrismaService.content.create.mockResolvedValue(expectedContent);

      const result = await service.createContent(topicId, createContentDto);

      expect(result).toEqual(expectedContent);
    });
  });

  describe('getContentByTopicId', () => {
    it('should return content by topic id', async () => {
      const topicId = 1;
      const expectedContent = {
        id: 1,
        topicId: 1,
        htmlContent: '<p>Content</p>',
        description: 'Description',
        createdAt: new Date(),
        updatedAt: new Date(),
        topic: { id: 1, name: 'Topic 1', type: 'content' },
        resources: [
          {
            id: 1,
            filename: 'image.jpg',
            resourceUrl: 'https://storage.googleapis.com/bucket/image.jpg',
            type: 'IMAGE',
            size: 1024,
            mimeType: 'image/jpeg',
            contentId: 1,
            createdAt: new Date(),
          },
        ],
      };

      mockPrismaService.content.findUnique.mockResolvedValue(expectedContent);

      const result = await service.getContentByTopicId(topicId);

      expect(mockPrismaService.content.findUnique).toHaveBeenCalledWith({
        where: { topicId },
        include: {
          topic: true,
          resources: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      expect(result).toEqual(expectedContent);
    });

    it('should return null if content not found', async () => {
      const topicId = 999;
      mockPrismaService.content.findUnique.mockResolvedValue(null);

      const result = await service.getContentByTopicId(topicId);

      expect(result).toBeNull();
    });
  });

  describe('updateContent', () => {
    it('should update content', async () => {
      const contentId = 1;
      const updateContentDto: UpdateContentDto = {
        htmlContent: '<p>Updated content</p>',
        description: 'Updated description',
      };

      const expectedContent = {
        id: 1,
        topicId: 1,
        htmlContent: '<p>Updated content</p>',
        description: 'Updated description',
        createdAt: new Date(),
        updatedAt: new Date(),
        topic: { id: 1, name: 'Topic 1', type: 'content' },
        resources: [],
      };

      mockPrismaService.content.update.mockResolvedValue(expectedContent);

      const result = await service.updateContent(contentId, updateContentDto);

      expect(mockPrismaService.content.update).toHaveBeenCalledWith({
        where: { id: contentId },
        data: updateContentDto,
        include: {
          topic: true,
          resources: true,
        },
      });
      expect(result).toEqual(expectedContent);
    });
  });

  describe('deleteContent', () => {
    it('should delete content', async () => {
      const contentId = 1;
      const deletedContent = {
        id: 1,
        topicId: 1,
        htmlContent: '<p>Content</p>',
        description: 'Description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.content.delete.mockResolvedValue(deletedContent);

      const result = await service.deleteContent(contentId);

      expect(mockPrismaService.content.delete).toHaveBeenCalledWith({
        where: { id: contentId },
      });
      expect(result).toEqual(deletedContent);
    });
  });

  describe('getAllContents', () => {
    it('should return all contents', async () => {
      const expectedContents = [
        {
          id: 1,
          topicId: 1,
          htmlContent: '<p>Content 1</p>',
          description: 'Description 1',
          createdAt: new Date(),
          updatedAt: new Date(),
          topic: { id: 1, name: 'Topic 1', type: 'content' },
          resources: [],
        },
        {
          id: 2,
          topicId: 2,
          htmlContent: '<p>Content 2</p>',
          description: 'Description 2',
          createdAt: new Date(),
          updatedAt: new Date(),
          topic: { id: 2, name: 'Topic 2', type: 'content' },
          resources: [],
        },
      ];

      mockPrismaService.content.findMany.mockResolvedValue(expectedContents);

      const result = await service.getAllContents();

      expect(mockPrismaService.content.findMany).toHaveBeenCalledWith({
        include: {
          topic: true,
          resources: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(expectedContents);
    });
  });
});
