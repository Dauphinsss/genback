import { Test, TestingModule } from '@nestjs/testing';
import { TopicsService } from './topics.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

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

  const mockNotifications = {
    createTopicCreatedNotification: jest.fn(),
    createTopicUpdatedNotification: jest.fn(),
    createTopicDeletedNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopicsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
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

      const userId = 42;
      const res = await service.createTopic(dto, userId);

      expect(mockPrisma.topic.create).toHaveBeenCalledWith({
        data: { name: 'Introduction to React', type: 'content' },
        include: {
          content: { include: { resources: true } },
          lessonTopics: { include: { lesson: true } },
        },
      });
      expect(res).toEqual(expected);
      expect(
        mockNotifications.createTopicCreatedNotification,
      ).toHaveBeenCalledWith(userId, expected.id, expected.name);
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

      const res = await service.createTopic(dto, 99);

      expect(mockPrisma.topic.create).toHaveBeenCalledWith({
        data: { name: 'Final Exam', type: 'evaluation' },
        include: {
          content: { include: { resources: true } },
          lessonTopics: { include: { lesson: true } },
        },
      });
      expect(res).toEqual(expected);
      expect(
        mockNotifications.createTopicCreatedNotification,
      ).toHaveBeenCalledWith(99, expected.id, expected.name);
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
    it('returns topic con blocksJson directamente de la DB', async () => {
      const topic = {
        id: 1,
        name: 'T',
        type: 'content',
        createdAt: new Date(),
        content: {
          id: 9,
          blocksJson: [{ type: 'paragraph', content: 'Test' }],
          resources: [],
        },
        lessonTopics: [],
      };
      mockPrisma.topic.findUnique.mockResolvedValue(topic);

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

      const res = await service.updateTopic(1, { name: 'Nuevo' }, 7);

      expect(mockPrisma.topic.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Nuevo' },
        include: {
          content: { include: { resources: true } },
          lessonTopics: { include: { lesson: true } },
        },
      });
      expect(res).toEqual(updated);
      expect(
        mockNotifications.createTopicUpdatedNotification,
      ).toHaveBeenCalledWith(7, updated.id, updated.name);
    });
  });

  describe('deleteTopic', () => {
    it('elimina un topic y notifica', async () => {
      const topic = { id: 5, name: 'Eliminar', type: 'content' };
      mockPrisma.topic.findUnique.mockResolvedValue(topic);
      mockPrisma.topic.delete.mockResolvedValue(topic);

      const res = await service.deleteTopic(5, 101);

      expect(mockPrisma.topic.delete).toHaveBeenCalledWith({
        where: { id: 5 },
      });
      expect(
        mockNotifications.createTopicDeletedNotification,
      ).toHaveBeenCalledWith(101, topic.id, topic.name);
      expect(res).toEqual(topic);
    });
  });
});
