import { Test, TestingModule } from '@nestjs/testing';
import { TopicsService } from './topics.service';
import { PrismaService } from '../prisma/prisma.service';
import { GCSContentService } from '../content/gcs-content.service';

describe('TopicsService', () => {
  let service: TopicsService;

  const mockPrisma = {
    topic: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockGCS = {
    deleteFile: jest.fn(),
    downloadHtmlFile: jest.fn(),
    downloadJsonFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopicsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GCSContentService, useValue: mockGCS },
      ],
    }).compile();

    service = module.get<TopicsService>(TopicsService);
    jest.clearAllMocks();
  });

  describe('createTopic', () => {
    it('should create a topic with default type "content"', async () => {
      const dto = { name: 'Introduction to React' };
      const expected = {
        id: 1,
        name: 'Introduction to React',
        type: 'content',
        createdAt: new Date(),
        content: null,
        lessonTopics: [],
      };

      mockPrisma.topic.create.mockResolvedValue(expected);

      const res = await service.createTopic(dto);

      expect(mockPrisma.topic.create).toHaveBeenCalledWith({
        data: { name: 'Introduction to React', type: 'content' },
        include: {
          content: { include: { resources: true } },
          lessonTopics: { include: { lesson: true } },
        },
      });
      expect(res).toEqual(expected);
    });

    it('should create a topic with specified type', async () => {
      const dto = { name: 'Final Exam', type: 'evaluation' as const };
      const expected = {
        id: 2,
        name: 'Final Exam',
        type: 'evaluation',
        createdAt: new Date(),
        content: null,
        lessonTopics: [],
      };

      mockPrisma.topic.create.mockResolvedValue(expected);

      const res = await service.createTopic(dto);

      expect(mockPrisma.topic.create).toHaveBeenCalledWith({
        data: { name: 'Final Exam', type: 'evaluation' },
        include: {
          content: { include: { resources: true } },
          lessonTopics: { include: { lesson: true } },
        },
      });
      expect(res).toEqual(expected);
    });
  });

  describe('getAllTopics', () => {
    it('returns topics including content.resources', async () => {
      mockPrisma.topic.findMany.mockResolvedValue([]);
      const res = await service.getAllTopics();
      expect(mockPrisma.topic.findMany).toHaveBeenCalledWith({
        include: {
          content: { include: { resources: true } },
          lessonTopics: {
            include: {
              lesson: {
                include: {
                  unit: { include: { courseBase: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(res).toEqual([]);
    });
  });

  describe('getTopicById', () => {
    it('returns topic and, si hay jsonFileUrl, el servicio podría descargarlo (no lo exigimos)', async () => {
      const topic = {
        id: 1,
        name: 'T',
        type: 'content',
        createdAt: new Date(),
        content: {
          id: 9,
          jsonFileUrl: 'https://gcs/topic-1/content.json',
          resources: [],
        },
        lessonTopics: [],
      };
      mockPrisma.topic.findUnique.mockResolvedValue(topic);
      mockGCS.downloadJsonFile.mockResolvedValue({ blocks: [] });

      const res = await service.getTopicById(1);

      expect(mockPrisma.topic.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          content: { include: { resources: true } },
          lessonTopics: {
            include: {
              lesson: {
                include: {
                  unit: { include: { courseBase: true } },
                },
              },
            },
          },
        },
      });
      expect(res).toEqual(topic);
    });

    it('returns null when not found', async () => {
      mockPrisma.topic.findUnique.mockResolvedValue(null);
      const res = await service.getTopicById(999);
      expect(res).toBeNull();
    });
  });

  describe('updateTopic', () => {
    it('updates a topic', async () => {
      const updated = {
        id: 1,
        name: 'Nuevo',
        type: 'content',
        createdAt: new Date(),
      };
      mockPrisma.topic.update.mockResolvedValue(updated);

      const res = await service.updateTopic(1, { name: 'Nuevo' });

      expect(mockPrisma.topic.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Nuevo' },
        include: {
          content: { include: { resources: true } },
          lessonTopics: { include: { lesson: true } },
        },
      });
      expect(res).toEqual(updated);
    });
  });
});
