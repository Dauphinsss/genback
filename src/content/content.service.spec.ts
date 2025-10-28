import { Test, TestingModule } from '@nestjs/testing';
import { ContentService } from './content.service';
import { PrismaService } from '../prisma/prisma.service';
import { GCSContentService } from './gcs-content.service';

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

  const gcs = {
    uploadJsonFile: jest.fn(), // NUEVO nombre para JSON
    downloadJsonFile: jest.fn(), // NUEVO nombre para JSON
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GCSContentService, useValue: gcs },
      ],
    }).compile();

    service = module.get(ContentService);
    jest.clearAllMocks();
  });

  describe('createContent', () => {
    it('crea content subiendo JSON a GCS y guardando jsonFileUrl', async () => {
      const topicId = 10;
      const dto: any = { description: 'desc', blocksJson: { blocks: [] } };

      gcs.uploadJsonFile.mockResolvedValue('https://gcs/topic-10/content.json');

      const created = {
        id: 1,
        topicId,
        jsonFileUrl: 'https://gcs/topic-10/content.json',
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

      expect(gcs.uploadJsonFile).toHaveBeenCalledWith(dto.blocksJson, topicId);
      expect(mockPrisma.content.create).toHaveBeenCalledWith({
        data: {
          topicId,
          jsonFileUrl: 'https://gcs/topic-10/content.json',
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
        jsonFileUrl: null,
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

      expect(gcs.uploadJsonFile).not.toHaveBeenCalled();
      expect(res).toEqual(created);
    });
  });

  describe('getContentByTopicId', () => {
    it('devuelve content y mantiene jsonFileUrl (no se asume blocksJson en respuesta)', async () => {
      const topicId = 20;
      const jsonUrl = 'https://gcs/topic-20/content.json';
      const found = {
        id: 3,
        topicId,
        jsonFileUrl: jsonUrl,
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

      // El servicio podría descargar internamente, pero el test SOLO valida el url.
      gcs.downloadJsonFile.mockResolvedValue({
        blocks: [{ type: 'paragraph', data: { text: 'Hola' } }],
      });

      const res: any = await service.getContentByTopicId(topicId);

      expect(mockPrisma.content.findUnique).toHaveBeenCalled();
      expect(gcs.downloadJsonFile).toHaveBeenCalledWith(jsonUrl);
      // Validamos que el objeto siga trayendo el url y NO esperamos blocksJson.
      expect(res.jsonFileUrl).toBe(jsonUrl);
    });

    it('retorna null si no existe', async () => {
      mockPrisma.content.findUnique.mockResolvedValue(null);
      const res = await service.getContentByTopicId(999);
      expect(res).toBeNull();
      expect(gcs.downloadJsonFile).not.toHaveBeenCalled();
    });
  });

  describe('updateContent', () => {
    it('actualiza subiendo nuevo JSON y guarda jsonFileUrl', async () => {
      const contentId = 5;
      const existing = {
        id: contentId,
        topicId: 77,
        jsonFileUrl: 'old',
        description: 'x',
      };
      mockPrisma.content.findUnique.mockResolvedValue(existing);

      const dto: any = { description: 'nuevo', blocksJson: { blocks: [] } };
      gcs.uploadJsonFile.mockResolvedValue('https://gcs/topic-77/content.json');

      const updated = {
        ...existing,
        jsonFileUrl: 'https://gcs/topic-77/content.json',
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

      expect(gcs.uploadJsonFile).toHaveBeenCalledWith(dto.blocksJson, 77);
      expect(mockPrisma.content.update).toHaveBeenCalledWith({
        where: { id: contentId },
        data: {
          jsonFileUrl: 'https://gcs/topic-77/content.json',
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
        jsonFileUrl: null,
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
          jsonFileUrl: null,
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
