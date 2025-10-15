// lessons.service.spec.ts
import { LessonsService } from './lessons.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

type MockedFn<T extends (...args: any[]) => any> = jest.MockedFunction<T>;

describe('LessonsService', () => {
  const prisma = {
    unit: {
      findUnique: jest.fn() as MockedFn<any>,
    },
    lesson: {
      findMany: jest.fn() as MockedFn<any>,
      findUnique: jest.fn() as MockedFn<any>,
      create: jest.fn() as MockedFn<any>,
      update: jest.fn() as MockedFn<any>,
      delete: jest.fn() as MockedFn<any>,
    },
  };

  let service: LessonsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LessonsService(prisma as any);
  });

  describe('getAllLessons', () => {
    it('retorna todas las lecciones de una unidad ordenadas por createdAt asc', async () => {
      const unitId = 3;
      const rows = [
        { id: 1, unitId, title: 'A' },
        { id: 2, unitId, title: 'B' },
      ] as any[];

      prisma.lesson.findMany.mockResolvedValue(rows);

      const result = await service.getAllLessons(unitId);

      expect(prisma.lesson.findMany).toHaveBeenCalledWith({
        where: { unitId },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toBe(rows);
    });
  });

  describe('getLessonById', () => {
    it('retorna una lección por id (incluye topics)', async () => {
      const row = {
        id: 7,
        title: 'L1',
        topics: [{ id: 100, title: 'T1' }],
      } as any;
      prisma.lesson.findUnique.mockResolvedValue(row);

      const result = await service.getLessonById(7);

      expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: 7 },
        include: { topics: true },
      });
      expect(result).toBe(row);
    });

    it('lanza NotFound si no existe', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);

      await expect(service.getLessonById(99)).rejects.toThrow(
        new NotFoundException('Lección no encontrada'),
      );
    });
  });

  describe('createLesson', () => {
    const dto = { title: 'Nueva', index: 0, unitId: 5 };

    it('crea una lección si la unidad existe y el curso está activo', async () => {
      prisma.unit.findUnique.mockResolvedValue({
        id: 5,
        courseBase: { status: 'activo' },
      } as any);

      const created = { id: 10, ...dto } as any;
      prisma.lesson.create.mockResolvedValue(created);

      const result = await service.createLesson(dto);

      expect(prisma.unit.findUnique).toHaveBeenCalledWith({
        where: { id: dto.unitId },
        include: { courseBase: true },
      });
      expect(prisma.lesson.create).toHaveBeenCalledWith({
        data: {
          title: dto.title,
          index: dto.index,
          unitId: dto.unitId,
        },
      });
      expect(result).toBe(created);
    });

    it('lanza NotFound si la unidad no existe', async () => {
      prisma.unit.findUnique.mockResolvedValue(null);

      await expect(service.createLesson(dto)).rejects.toThrow(
        new NotFoundException('Unidad no encontrada'),
      );
      expect(prisma.lesson.create).not.toHaveBeenCalled();
    });

    it('lanza BadRequest si el curso no está activo', async () => {
      prisma.unit.findUnique.mockResolvedValue({
        id: 5,
        courseBase: { status: 'borrador' },
      } as any);

      await expect(service.createLesson(dto)).rejects.toThrow(
        new BadRequestException('El curso asociado no está activo'),
      );
      expect(prisma.lesson.create).not.toHaveBeenCalled();
    });
  });

  describe('updateLesson', () => {
    it('actualiza una lección si existe', async () => {
      prisma.lesson.findUnique.mockResolvedValue({ id: 9 } as any);
      const updated = { id: 9, title: 'Editado', index: 2 } as any;
      prisma.lesson.update.mockResolvedValue(updated);

      const result = await service.updateLesson(9, {
        title: 'Editado',
        index: 2,
      });

      expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: 9 },
      });
      expect(prisma.lesson.update).toHaveBeenCalledWith({
        where: { id: 9 },
        data: { title: 'Editado', index: 2 },
      });
      expect(result).toBe(updated);
    });

    it('lanza NotFound si no existe', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);

      await expect(service.updateLesson(9, { title: 'X' })).rejects.toThrow(
        new NotFoundException('Lección no encontrada'),
      );
      expect(prisma.lesson.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteLesson', () => {
    it('elimina una lección si existe', async () => {
      prisma.lesson.findUnique.mockResolvedValue({ id: 11 } as any);
      const deleted = { id: 11 } as any;
      prisma.lesson.delete.mockResolvedValue(deleted);

      const result = await service.deleteLesson(11);

      expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: 11 },
      });
      expect(prisma.lesson.delete).toHaveBeenCalledWith({ where: { id: 11 } });
      expect(result).toBe(deleted);
    });

    it('lanza NotFound si no existe', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);

      await expect(service.deleteLesson(11)).rejects.toThrow(
        new NotFoundException('Lección no encontrada'),
      );
      expect(prisma.lesson.delete).not.toHaveBeenCalled();
    });
  });
});
