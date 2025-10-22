import { Test, TestingModule } from '@nestjs/testing';
import { TopicsService } from './topics.service';
import { PrismaService } from '../prisma/prisma.service';
import { GCSContentService } from '../content/gcs-content.service';
import { CreateTopicDto, UpdateTopicDto } from './dto/topic.dto';

describe('TopicsService', () => {
  let service: TopicsService;

  const mockPrismaService = {
    topic: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockGCSContentService = {
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopicsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: GCSContentService,
          useValue: mockGCSContentService,
        },
      ],
    }).compile();

    service = module.get<TopicsService>(TopicsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTopic', () => {
    it('should create a topic with default type "content"', async () => {
      const createTopicDto: CreateTopicDto = {
        name: 'Introduction to React',
      };

      const expectedTopic = {
        id: 1,
        name: 'Introduction to React',
        type: 'content',
        createdAt: new Date(),
      };

      mockPrismaService.topic.create.mockResolvedValue(expectedTopic);

      const result = await service.createTopic(createTopicDto);

      expect(mockPrismaService.topic.create).toHaveBeenCalledWith({
        data: {
          name: 'Introduction to React',
          type: 'content',
        },
        include: {
          content: true,
          lessonTopics: {
            include: {
              lesson: true,
            },
          },
        },
      });
      expect(result).toEqual(expectedTopic);
    });

    it('should create a topic with specified type', async () => {
      const createTopicDto: CreateTopicDto = {
        name: 'Final Exam',
        type: 'evaluation',
      };

      const expectedTopic = {
        id: 2,
        name: 'Final Exam',
        type: 'evaluation',
        createdAt: new Date(),
      };

      mockPrismaService.topic.create.mockResolvedValue(expectedTopic);

      const result = await service.createTopic(createTopicDto);

      expect(mockPrismaService.topic.create).toHaveBeenCalledWith({
        data: {
          name: 'Final Exam',
          type: 'evaluation',
        },
        include: {
          content: true,
          lessonTopics: {
            include: {
              lesson: true,
            },
          },
        },
      });
      expect(result).toEqual(expectedTopic);
    });
  });

  describe('getAllTopics', () => {
    it('should return all topics with their content and courses', async () => {
      const expectedTopics = [
        {
          id: 1,
          name: 'Topic 1',
          type: 'content',
          createdAt: new Date(),
          content: null,
          lessonTopics: [],
        },
        {
          id: 2,
          name: 'Topic 2',
          type: 'evaluation',
          createdAt: new Date(),
          content: { id: 1, htmlContent: '<p>Content</p>' },
          lessonTopics: [],
        },
      ];

      mockPrismaService.topic.findMany.mockResolvedValue(expectedTopics);

      const result = await service.getAllTopics();

      expect(mockPrismaService.topic.findMany).toHaveBeenCalledWith({
        include: {
          content: {
            include: {
              resources: true,
            },
          },
          lessonTopics: {
            include: {
              lesson: {
                include: {
                  unit: {
                    include: {
                      courseBase: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(expectedTopics);
    });
  });

  describe('getTopicById', () => {
    it('should return a topic by id', async () => {
      const topicId = 1;
      const expectedTopic = {
        id: 1,
        name: 'Topic 1',
        type: 'content',
        createdAt: new Date(),
        content: null,
        lessonTopics: [],
      };

      mockPrismaService.topic.findUnique.mockResolvedValue(expectedTopic);

      const result = await service.getTopicById(topicId);

      expect(mockPrismaService.topic.findUnique).toHaveBeenCalledWith({
        where: { id: topicId },
        include: {
          content: {
            include: {
              resources: true,
            },
          },
          lessonTopics: {
            include: {
              lesson: {
                include: {
                  unit: {
                    include: {
                      courseBase: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      expect(result).toEqual(expectedTopic);
    });

    it('should return null if topic not found', async () => {
      const topicId = 999;
      mockPrismaService.topic.findUnique.mockResolvedValue(null);

      const result = await service.getTopicById(topicId);

      expect(result).toBeNull();
    });
  });

  describe('updateTopic', () => {
    it('should update a topic', async () => {
      const topicId = 1;
      const updateTopicDto: UpdateTopicDto = {
        name: 'Updated Topic Name',
      };

      const expectedTopic = {
        id: 1,
        name: 'Updated Topic Name',
        type: 'content',
        createdAt: new Date(),
      };

      mockPrismaService.topic.update.mockResolvedValue(expectedTopic);

      const result = await service.updateTopic(topicId, updateTopicDto);

      expect(mockPrismaService.topic.update).toHaveBeenCalledWith({
        where: { id: topicId },
        data: updateTopicDto,
        include: {
          content: {
            include: {
              resources: true,
            },
          },
          lessonTopics: {
            include: {
              lesson: true,
            },
          },
        },
      });
      expect(result).toEqual(expectedTopic);
    });
  });

  describe('deleteTopic', () => {
    it('should delete a topic', async () => {
      const topicId = 1;
      const topicWithContent = {
        id: 1,
        name: 'Deleted Topic',
        type: 'content',
        createdAt: new Date(),
        content: null,
      };
      const deletedTopic = {
        id: 1,
        name: 'Deleted Topic',
        type: 'content',
        createdAt: new Date(),
      };

      mockPrismaService.topic.findUnique.mockResolvedValue(topicWithContent);
      mockPrismaService.topic.delete.mockResolvedValue(deletedTopic);

      const result = await service.deleteTopic(topicId);

      expect(mockPrismaService.topic.findUnique).toHaveBeenCalledWith({
        where: { id: topicId },
        include: { content: true },
      });
      expect(mockPrismaService.topic.delete).toHaveBeenCalledWith({
        where: { id: topicId },
      });
      expect(result).toEqual(deletedTopic);
    });

    it('should delete HTML file from GCS if content exists', async () => {
      const topicId = 1;
      const htmlFileUrl =
        'https://storage.googleapis.com/bucket/topics/1/content.html';
      const topicWithContent = {
        id: 1,
        name: 'Topic with Content',
        type: 'content',
        createdAt: new Date(),
        content: {
          id: 1,
          htmlFileUrl: htmlFileUrl,
          description: 'Test',
          topicId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
      const deletedTopic = {
        id: 1,
        name: 'Topic with Content',
        type: 'content',
        createdAt: new Date(),
      };

      mockPrismaService.topic.findUnique.mockResolvedValue(topicWithContent);
      mockPrismaService.topic.delete.mockResolvedValue(deletedTopic);
      mockGCSContentService.deleteFile.mockResolvedValue(undefined);

      const result = await service.deleteTopic(topicId);

      expect(mockGCSContentService.deleteFile).toHaveBeenCalledWith(
        htmlFileUrl,
      );
      expect(mockPrismaService.topic.delete).toHaveBeenCalledWith({
        where: { id: topicId },
      });
      expect(result).toEqual(deletedTopic);
    });
  });

  describe('getTopicsByType', () => {
    it('should return topics filtered by type', async () => {
      const topicType = 'content';
      const expectedTopics = [
        {
          id: 1,
          name: 'Content Topic 1',
          type: 'content',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.topic.findMany.mockResolvedValue(expectedTopics);

      const result = await service.getTopicsByType(topicType);

      expect(mockPrismaService.topic.findMany).toHaveBeenCalledWith({
        where: { type: topicType },
        include: {
          content: {
            include: {
              resources: true,
            },
          },
          lessonTopics: {
            include: {
              lesson: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(expectedTopics);
    });
  });
});
