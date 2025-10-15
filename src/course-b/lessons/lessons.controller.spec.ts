// lessons.controller.spec.ts
import { BadRequestException } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';

describe('LessonsController', () => {
  let controller: LessonsController;
  let service: jest.Mocked<LessonsService>;

  beforeEach(() => {
    service = {
      getAllLessons: jest.fn(),
      getLessonById: jest.fn(),
      createLesson: jest.fn(),
      updateLesson: jest.fn(),
      deleteLesson: jest.fn(),
    } as unknown as jest.Mocked<LessonsService>;

    controller = new LessonsController(service);
  });

  // GET /lessons?unitId=1
  describe('getAll', () => {
    it('retorna lecciones de una unidad cuando unitId es válido', async () => {
      const rows = [{ id: 1 }, { id: 2 }] as any[];
      service.getAllLessons.mockResolvedValue(rows);

      const result = await controller.getAll('3');

      expect(service.getAllLessons).toHaveBeenCalledWith(3);
      expect(result).toBe(rows);
    });

    it('lanza BadRequest si falta unitId', async () => {
      await expect(controller.getAll(undefined)).rejects.toThrow(
        new BadRequestException('Falta el parámetro unitId'),
      );
      expect(service.getAllLessons).not.toHaveBeenCalled();
    });

    it('lanza BadRequest si unitId no es número', async () => {
      await expect(controller.getAll('abc')).rejects.toThrow(
        new BadRequestException('unitId debe ser un número'),
      );
      expect(service.getAllLessons).not.toHaveBeenCalled();
    });
  });

  // GET /lessons/:id
  describe('getOne', () => {
    it('retorna una lección por id', async () => {
      const lesson = { id: 5, title: 'L1' } as any;
      service.getLessonById.mockResolvedValue(lesson);

      const result = await controller.getOne(5);

      expect(service.getLessonById).toHaveBeenCalledWith(5);
      expect(result).toBe(lesson);
    });
  });

  // POST /lessons
  describe('create', () => {
    it('crea una lección con payload válido', async () => {
      const body = { title: 'Nueva', index: 0, unitId: 7 };
      const created = { id: 10, ...body } as any;
      service.createLesson.mockResolvedValue(created);

      const result = await controller.create(body);

      expect(service.createLesson).toHaveBeenCalledWith({
        title: 'Nueva',
        index: 0,
        unitId: 7,
      });
      expect(result).toBe(created);
    });

    it('lanza BadRequest si faltan campos requeridos (ninguno enviado)', async () => {
      await expect(controller.create({} as any)).rejects.toThrow(
        new BadRequestException('title, index y unitId son requeridos'),
      );
      expect(service.createLesson).not.toHaveBeenCalled();
    });

    it('lanza BadRequest si falta index', async () => {
      await expect(
        controller.create({ title: 'X', unitId: 1 } as any),
      ).rejects.toThrow(
        new BadRequestException('title, index y unitId son requeridos'),
      );
      expect(service.createLesson).not.toHaveBeenCalled();
    });

    it('lanza BadRequest si falta unitId', async () => {
      await expect(
        controller.create({ title: 'X', index: 0 } as any),
      ).rejects.toThrow(
        new BadRequestException('title, index y unitId son requeridos'),
      );
      expect(service.createLesson).not.toHaveBeenCalled();
    });

    it('convierte tipos a number/string según corresponda', async () => {
      const body = { title: 'Nueva', index: '2' as any, unitId: '9' as any };
      const created = { id: 11, title: 'Nueva', index: 2, unitId: 9 } as any;
      service.createLesson.mockResolvedValue(created);

      const result = await controller.create(body as any);

      expect(service.createLesson).toHaveBeenCalledWith({
        title: 'Nueva',
        index: 2,
        unitId: 9,
      });
      expect(result).toBe(created);
    });
  });

  // PATCH /lessons/:id
  describe('update', () => {
    it('actualiza con al menos un campo válido', async () => {
      const updated = { id: 4, title: 'Editado', index: 3 } as any;
      service.updateLesson.mockResolvedValue(updated);

      const result = await controller.update(4, { title: 'Editado', index: 3 });

      expect(service.updateLesson).toHaveBeenCalledWith(4, {
        title: 'Editado',
        index: 3,
      });
      expect(result).toBe(updated);
    });

    it('convierte tipos (title string, index number)', async () => {
      const updated = { id: 4, title: 'Editado 2', index: 1 } as any;
      service.updateLesson.mockResolvedValue(updated);

      const result = await controller.update(4, {
        title: 'Editado 2',
        index: '1' as any,
      });

      expect(service.updateLesson).toHaveBeenCalledWith(4, {
        title: 'Editado 2',
        index: 1,
      });
      expect(result).toBe(updated);
    });

    it('lanza BadRequest si no se envía ningún campo', async () => {
      await expect(controller.update(4, {})).rejects.toThrow(
        new BadRequestException('Debes enviar al menos un campo a actualizar'),
      );
      expect(service.updateLesson).not.toHaveBeenCalled();
    });
  });

  // DELETE /lessons/:id
  describe('remove', () => {
    it('elimina una lección', async () => {
      const deleted = { id: 8 } as any;
      service.deleteLesson.mockResolvedValue(deleted);

      const result = await controller.remove(8);

      expect(service.deleteLesson).toHaveBeenCalledWith(8);
      expect(result).toBe(deleted);
    });
  });
});
