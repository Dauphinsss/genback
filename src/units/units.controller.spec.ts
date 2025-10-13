// src/units/units.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UnitsController } from './units.controller';
import { UnitsService } from './units.service';
import { NotFoundException } from '@nestjs/common';
import { CreateUnitDto } from './dto/create-unit.dto';

describe('UnitsController', () => {
  let controller: UnitsController;

  const unitsServiceStub = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  } as unknown as UnitsService;

  beforeEach(async () => {
    // Limpia el estado de los mocks entre tests
    (unitsServiceStub.create as jest.Mock)?.mockReset?.();
    (unitsServiceStub.findAll as jest.Mock)?.mockReset?.();
    (unitsServiceStub.findOne as jest.Mock)?.mockReset?.();
    (unitsServiceStub.remove as jest.Mock)?.mockReset?.();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnitsController],
      providers: [{ provide: UnitsService, useValue: unitsServiceStub }],
    }).compile();

    controller = module.get<UnitsController>(UnitsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debe delegar en UnitsService.create y retornar el resultado', async () => {
      const dto: CreateUnitDto = { title: 'U1', index: 1, published: true };
      const created = { id: 10, ...dto };
      (unitsServiceStub.create as jest.Mock).mockResolvedValue(created);

      const result = await controller.create(dto);
      expect(unitsServiceStub.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });
  });

  describe('findAll', () => {
    it('debe retornar todas las unidades', async () => {
      const rows = [{ id: 1 }, { id: 2 }];
      (unitsServiceStub.findAll as jest.Mock).mockResolvedValue(rows);

      const result = await controller.findAll();
      expect(unitsServiceStub.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });
  });

  describe('findOne', () => {
    it('debe retornar la unidad cuando existe', async () => {
      const row = { id: 7, title: 'U7', index: 1, published: true };
      (unitsServiceStub.findOne as jest.Mock).mockResolvedValue(row);

      const result = await controller.findOne(7);
      expect(unitsServiceStub.findOne).toHaveBeenCalledWith(7);
      expect(result).toEqual(row);
    });

    it('debe lanzar NotFoundException cuando el servicio devuelve null', async () => {
      (unitsServiceStub.findOne as jest.Mock).mockResolvedValue(null);

      await expect(controller.findOne(123)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(unitsServiceStub.findOne).toHaveBeenCalledWith(123);
    });
  });

  describe('remove', () => {
    it('debe delegar en UnitsService.remove y retornar el resultado', async () => {
      const deleted = { id: 5, title: 'U5', index: 1, published: true };
      (unitsServiceStub.remove as jest.Mock).mockResolvedValue(deleted);

      const result = await controller.remove(5);
      expect(unitsServiceStub.remove).toHaveBeenCalledWith(5);
      expect(result).toEqual(deleted);
    });
  });
});
