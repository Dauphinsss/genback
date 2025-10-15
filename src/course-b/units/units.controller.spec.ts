// units.service.spec.ts
import { UnitsService } from './units.service';
import { Unit } from '@prisma/client';

type MockedFn<T extends (...args: any) => any> = jest.MockedFunction<T>;

const unitFactory = (overrides: Partial<Unit> = {}): Unit => {
  const now = new Date();
  return {
    id: 1,
    title: 'Intro',
    index: 0,
    courseBaseId: 1,
    published: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

describe('UnitsService', () => {
  const prisma = {
    courseBase: { findUnique: jest.fn() as MockedFn<any> },
    unit: {
      create: jest.fn() as MockedFn<any>,
      findMany: jest.fn() as MockedFn<any>,
      findUnique: jest.fn() as MockedFn<any>,
      update: jest.fn() as MockedFn<any>,
      delete: jest.fn() as MockedFn<any>,
    },
    lesson: {
      deleteMany: jest.fn() as MockedFn<any>,
    },
  };

  let service: UnitsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UnitsService(prisma as any);
  });

  describe('createUnit', () => {
    const payload = { title: 'Intro', courseBaseId: 1, index: 0 };

    it('crea una unidad cuando el curso existe y está activo', async () => {
      prisma.courseBase.findUnique.mockResolvedValue({
        id: 1,
        status: 'activo',
      });
      const created = unitFactory({ id: 10, ...payload });
      prisma.unit.create.mockResolvedValue(created);

      const result = await service.createUnit(payload);

      expect(prisma.courseBase.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prisma.unit.create).toHaveBeenCalledWith({
        data: {
          title: 'Intro',
          index: 0,
          courseBase: { connect: { id: 1 } },
        },
      });
      expect(result).toEqual(created);
    });

    it('lanza error si el curso no existe', async () => {
      prisma.courseBase.findUnique.mockResolvedValue(null);

      await expect(service.createUnit(payload)).rejects.toThrow(
        'Curso no encontrado',
      );
      expect(prisma.unit.create).not.toHaveBeenCalled();
    });

    it('lanza error si el curso no está activo', async () => {
      prisma.courseBase.findUnique.mockResolvedValue({
        id: 1,
        status: 'borrador',
      });

      await expect(service.createUnit(payload)).rejects.toThrow(
        'El curso no está activo',
      );
      expect(prisma.unit.create).not.toHaveBeenCalled();
    });
  });

  describe('getAllUnits', () => {
    it('retorna todas las unidades ordenadas', async () => {
      const rows: Unit[] = [unitFactory({ id: 1 }), unitFactory({ id: 2 })];
      prisma.unit.findMany.mockResolvedValue(rows);

      const result = await service.getAllUnits();

      expect(prisma.unit.findMany).toHaveBeenCalledWith({
        orderBy: [{ courseBaseId: 'asc' }, { index: 'asc' }],
      });
      expect(result).toBe(rows);
    });
  });

  describe('getUnitById', () => {
    it('retorna una unidad por id', async () => {
      const row = unitFactory({ id: 7 });
      prisma.unit.findUnique.mockResolvedValue(row);

      const result = await service.getUnitById(7);

      expect(prisma.unit.findUnique).toHaveBeenCalledWith({ where: { id: 7 } });
      expect(result).toEqual(row);
    });
  });

  describe('getUnitsByCourse', () => {
    it('retorna unidades por curso ordenadas por index', async () => {
      const rows: Unit[] = [
        unitFactory({
          id: 1,
          courseBaseId: 3,
        }),
        unitFactory({
          id: 2,
          courseBaseId: 3,
        }),
      ];
      prisma.unit.findMany.mockResolvedValue(rows);

      const result = await service.getUnitsByCourse(3);

      expect(prisma.unit.findMany).toHaveBeenCalledWith({
        where: { courseBaseId: 3 },
        orderBy: { index: 'asc' },
      });
      expect(result).toBe(rows);
    });
  });

  describe('updateUnit', () => {
    it('actualiza el título de la unidad', async () => {
      const updated = unitFactory({ id: 5, title: 'Nuevo título' });
      prisma.unit.update.mockResolvedValue(updated);

      const result = await service.updateUnit(5, 'Nuevo título');

      expect(prisma.unit.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { title: 'Nuevo título' },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('deleteUnit', () => {
    it('borra primero las lecciones y luego la unidad', async () => {
      prisma.lesson.deleteMany.mockResolvedValue({ count: 3 });
      const deleted = unitFactory({ id: 9 });
      prisma.unit.delete.mockResolvedValue(deleted);

      const result = await service.deleteUnit(9);

      expect(prisma.lesson.deleteMany).toHaveBeenCalledWith({
        where: { unitId: 9 },
      });
      expect(prisma.unit.delete).toHaveBeenCalledWith({ where: { id: 9 } });
      expect(result).toEqual(deleted);
    });

    it('propaga errores de Prisma al borrar', async () => {
      prisma.lesson.deleteMany.mockResolvedValue({ count: 0 });
      prisma.unit.delete.mockRejectedValue(new Error('DB error'));

      await expect(service.deleteUnit(1)).rejects.toThrow('DB error');
    });
  });
});
