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
    historicContent: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
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

    it('crea una entrada de histórico con timestamp y profesor tras la creación', async () => {
      const topicId = 15;
      const blocksJson = [{ type: 'paragraph', content: 'Versión 1.0' }];
      const dto: any = {
        description: 'Descripción inicial',
        blocksJson,
        createdBy: 'Profesor 1',
      };

      const created = {
        id: 3,
        topicId,
        blocksJson,
        description: 'Descripción inicial',
        createdAt: new Date(),
        updatedAt: new Date(),
        topic: {
          id: topicId,
          name: 'T3',
          type: 'content',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        resources: [],
      };
      mockPrisma.content.create.mockResolvedValue(created);

      await service.createContent(topicId, dto);

      expect(mockPrisma.historicContent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contentId: created.id,
            snapshotBlocksJson: blocksJson,
            snapshotDescription: 'Descripción inicial',
            performedBy: 'Profesor 1',
            changeSummary: 'Creó el contenido',
          }),
        }),
      );
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

    it('guarda en el histórico quién actualizó y cuándo, junto con el snapshot nuevo', async () => {
      const contentId = 33;
      const existing = {
        id: contentId,
        topicId: 901,
        blocksJson: [{ type: 'paragraph', content: 'Versión previa' }],
        description: 'Descripción previa',
      };
      mockPrisma.content.findUnique.mockResolvedValue(existing);

      const dto: any = {
        description: 'Descripción nueva',
        blocksJson: [{ type: 'paragraph', content: 'Versión nueva' }],
        updatedBy: 'Profesor 1',
        changeSummary: 'Actualizó el contenido',
      };

      mockPrisma.content.update.mockResolvedValue({
        ...existing,
        blocksJson: dto.blocksJson,
        description: dto.description,
        updatedAt: new Date(),
        createdAt: new Date(),
        topic: {},
        resources: [],
      });

      await service.updateContent(contentId, dto);

      expect(mockPrisma.historicContent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contentId,
            snapshotBlocksJson: dto.blocksJson,
            snapshotDescription: dto.description,
            performedBy: 'Profesor 1',
            changeSummary: 'Actualizó el contenido',
          }),
        }),
      );
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

  describe('histórico de contenido', () => {
    it('lista el historial ordenado por fecha descendente con profesor y resumen de cambio', async () => {
      const contentId = 2024;
      const historyList = [
        {
          id: 1,
          contentId,
          performedBy: 'Profesor 2',
          changeSummary: 'Actualizó la introducción',
          createdAt: new Date(),
        },
      ];
      mockPrisma.historicContent.findMany.mockResolvedValue(historyList);

      const res = await (service as any).getContentHistory(contentId);

      expect(mockPrisma.historicContent.findMany).toHaveBeenCalledWith({
        where: { contentId },
        orderBy: { createdAt: 'desc' },
      });
      expect(res).toEqual(historyList);
    });

    it('restaura una versión previa usando el snapshot almacenado', async () => {
      const historyId = 55;
      const contentId = 78;
      const historyEntry = {
        id: historyId,
        contentId,
        snapshotBlocksJson: [{ type: 'paragraph', content: 'Snapshot' }],
        snapshotDescription: 'Descripción snapshot',
        performedBy: 'Profesor 1',
        changeSummary: 'Actualizó el contenido',
        createdAt: new Date(),
      };

      mockPrisma.historicContent.findUnique.mockResolvedValue(historyEntry);
      mockPrisma.content.update.mockResolvedValue({
        id: contentId,
        topicId: 9,
        blocksJson: historyEntry.snapshotBlocksJson,
        description: historyEntry.snapshotDescription,
        createdAt: new Date(),
        updatedAt: new Date(),
        topic: {},
        resources: [],
      });

      const restored = await (service as any).restoreContentVersion(historyId, {
        restoredBy: 'Profesor 3',
      });

      expect(mockPrisma.content.update).toHaveBeenCalledWith({
        where: { id: contentId },
        data: {
          blocksJson: historyEntry.snapshotBlocksJson,
          description: historyEntry.snapshotDescription,
        },
        include: { topic: true, resources: true },
      });

      expect(mockPrisma.historicContent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contentId,
            performedBy: 'Profesor 3',
            changeSummary: 'Restauró una versión anterior',
          }),
        }),
      );

      expect(restored).toEqual(
        expect.objectContaining({
          id: contentId,
          blocksJson: historyEntry.snapshotBlocksJson,
        }),
      );
    });
  });
});
