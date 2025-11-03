import { Test, TestingModule } from '@nestjs/testing';
import { ContentService } from './content.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ContentService (unit)', () => {
  let service: ContentService;

  const mockPrisma = {
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
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(ContentService);
    jest.clearAllMocks();
  });

  describe('createContent', () => {
    it('crea content guardando blocksJson directamente en DB', async () => {
      const topicId = 10;
      const blocksJson = [{ type: 'paragraph', content: 'Test' }];
      const dto: any = { description: 'desc', blocksJson };

      const created = {
        id: 1,
        topicId,
        blocksJson,
        description: 'desc',
        createdAt: new Date(),
        updatedAt: new Date(),
        topic: {
          id: topicId,
          name: 'T',
          type: 'content',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        resources: [],
      };
      mockPrisma.content.create.mockResolvedValue(created);

      const res = await service.createContent(topicId, dto);

      expect(mockPrisma.content.create).toHaveBeenCalledWith({
        data: {
          topicId,
          blocksJson,
          description: 'desc',
        },
        include: { topic: true, resources: true },
      });
      expect(res).toEqual(created);
    });

    it('crea content vacío cuando no hay blocksJson', async () => {
      const topicId = 11;
      const dto: any = {}; // sin blocksJson

      const created = {
        id: 2,
        topicId,
        blocksJson: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        topic: {
          id: topicId,
          name: 'T2',
          type: 'content',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        resources: [],
      };
      mockPrisma.content.create.mockResolvedValue(created);

      const res = await service.createContent(topicId, dto);

      expect(res).toEqual(created);
    });
  });

  describe('getContentByTopicId', () => {
    it('devuelve content con blocksJson desde la DB', async () => {
      const topicId = 20;
      const blocksJson = [{ type: 'paragraph', content: 'Hola' }];
      const found = {
        id: 3,
        topicId,
        blocksJson,
        description: 'd',
        createdAt: new Date(),
        updatedAt: new Date(),
        topic: {
          id: topicId,
          name: 'T',
          type: 'content',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        resources: [],
      };
      mockPrisma.content.findUnique.mockResolvedValue(found);

      const res: any = await service.getContentByTopicId(topicId);

      expect(mockPrisma.content.findUnique).toHaveBeenCalled();
      expect(res.blocksJson).toEqual(blocksJson);
    });

    it('retorna null si no existe', async () => {
      mockPrisma.content.findUnique.mockResolvedValue(null);
      const res = await service.getContentByTopicId(999);
      expect(res).toBeNull();
    });
  });

  describe('updateContent', () => {
    it('actualiza guardando nuevo blocksJson en DB', async () => {
      const contentId = 5;
      const blocksJson = [{ type: 'heading', content: 'Nuevo' }];
      const existing = {
        id: contentId,
        topicId: 77,
        blocksJson: [{ type: 'paragraph', content: 'Viejo' }],
        description: 'x',
      };
      mockPrisma.content.findUnique.mockResolvedValue(existing);

      const dto: any = { description: 'nuevo', blocksJson };

      const updated = {
        ...existing,
        blocksJson,
        description: 'nuevo',
        updatedAt: new Date(),
        createdAt: new Date(),
        topic: {
          id: 77,
          name: 'T',
          type: 'content',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        resources: [],
      };
      mockPrisma.content.update.mockResolvedValue(updated);

      const res = await service.updateContent(contentId, dto);

      expect(mockPrisma.content.update).toHaveBeenCalledWith({
        where: { id: contentId },
        data: {
          blocksJson,
          description: 'nuevo',
        },
        include: { topic: true, resources: true },
      });
      expect(res).toEqual(updated);
    });
  });

  describe('deleteContent', () => {
    it('elimina content', async () => {
      const contentId = 9;
      const deleted = {
        id: contentId,
        topicId: 1,
        blocksJson: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.content.delete.mockResolvedValue(deleted);

      const res = await service.deleteContent(contentId);
      expect(mockPrisma.content.delete).toHaveBeenCalledWith({
        where: { id: contentId },
      });
      expect(res).toEqual(deleted);
    });
  });

  describe('getAllContents', () => {
    it('lista contenidos', async () => {
      const list = [
        {
          id: 1,
          topicId: 1,
          blocksJson: null,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          topic: {},
          resources: [],
        },
      ];
      mockPrisma.content.findMany.mockResolvedValue(list);

      const res = await service.getAllContents();
      expect(mockPrisma.content.findMany).toHaveBeenCalledWith({
        include: { topic: true, resources: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(res).toEqual(list);
    });
  });
});
