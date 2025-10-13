// src/units/units.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UnitsService } from './units.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UnitsService', () => {
  let service: UnitsService;

  // Se recrean los mocks en cada test para aislar efectos
  let prismaStub: {
    unit: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
    lesson: {
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prismaStub = {
      unit: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      lesson: {
        deleteMany: jest.fn(),
      },
      // Simula el comportamiento real de Prisma: recibe un callback y le inyecta "tx"
      $transaction: jest.fn(async (cb: any) => {
        const tx = {
          unit: prismaStub.unit,
          lesson: prismaStub.lesson,
        };
        return cb(tx);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitsService,
        {
          provide: PrismaService,
          useValue: prismaStub as unknown as PrismaService,
        },
      ],
    }).compile();

    service = module.get<UnitsService>(UnitsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('crea una unidad con los datos recibidos', async () => {
      const dto = { title: 'Unidad 1', index: 1, published: true };
      const created = { id: 10, ...dto };
      prismaStub.unit.create.mockResolvedValue(created);

      const result = await service.create(dto as any);
      expect(prismaStub.unit.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(created);
    });
  });

  describe('findAll', () => {
    it('retorna todas las unidades', async () => {
      const rows = [{ id: 1 }, { id: 2 }];
      prismaStub.unit.findMany.mockResolvedValue(rows);

      const result = await service.findAll();
      expect(prismaStub.unit.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });
  });

  describe('findOne', () => {
    it('retorna la unidad si existe', async () => {
      const row = { id: 7, title: 'U7', index: 1, published: true };
      prismaStub.unit.findUnique.mockResolvedValue(row);

      const result = await service.findOne(7);
      expect(prismaStub.unit.findUnique).toHaveBeenCalledWith({
        where: { id: 7 },
      });
      expect(result).toEqual(row);
    });

    it('lanza NotFoundException si no existe', async () => {
      prismaStub.unit.findUnique.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prismaStub.unit.findUnique).toHaveBeenCalledWith({
        where: { id: 99 },
      });
    });
  });

  describe('remove', () => {
    it('borra lecciones de la unidad y luego la unidad dentro de una transacción', async () => {
      prismaStub.unit.findUnique.mockResolvedValue({ id: 5 });

      const deletedUnit = { id: 5, title: 'U5', index: 1, published: true };
      prismaStub.lesson.deleteMany.mockResolvedValue({ count: 2 });
      prismaStub.unit.delete.mockResolvedValue(deletedUnit);

      const result = await service.remove(5);

      // Validación de existencia
      expect(prismaStub.unit.findUnique).toHaveBeenCalledWith({
        where: { id: 5 },
      });
      // Transacción
      expect(prismaStub.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaStub.lesson.deleteMany).toHaveBeenCalledWith({
        where: { unitId: 5 },
      });
      expect(prismaStub.unit.delete).toHaveBeenCalledWith({ where: { id: 5 } });

      expect(result).toEqual(deletedUnit);
    });

    it('propaga NotFoundException si la unidad no existe', async () => {
      prismaStub.unit.findUnique.mockResolvedValue(null);

      await expect(service.remove(123)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(prismaStub.$transaction).not.toHaveBeenCalled();
    });
  });
});
