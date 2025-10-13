import { Test, TestingModule } from '@nestjs/testing';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';

describe('LessonsController', () => {
  let controller: LessonsController;

  // Stub de LessonsService con mocks de Jest
  const lessonsServiceStub = {
    create: jest.fn(),
    findAll: jest.fn(),
    remove: jest.fn(),
  } as unknown as LessonsService;

  beforeEach(async () => {
    // Reset de mocks antes de cada test
    (lessonsServiceStub.create as jest.Mock)?.mockReset?.();
    (lessonsServiceStub.findAll as jest.Mock)?.mockReset?.();
    (lessonsServiceStub.remove as jest.Mock)?.mockReset?.();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonsController],
      providers: [{ provide: LessonsService, useValue: lessonsServiceStub }],
    }).compile();

    controller = module.get<LessonsController>(LessonsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debe delegar en LessonsService.create y retornar el resultado', async () => {
      const dto: CreateLessonDto = {
        title: 'L1',
        index: 1,
        published: true,
        unitId: 2,
      };
      const created = { id: 10, ...dto };
      (lessonsServiceStub.create as jest.Mock).mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(lessonsServiceStub.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });
  });

  describe('findAll', () => {
    it('debe retornar todas las lecciones del servicio', async () => {
      const lessons = [
        { id: 1, title: 'L1', unitId: 1 },
        { id: 2, title: 'L2', unitId: 2 },
      ];
      (lessonsServiceStub.findAll as jest.Mock).mockResolvedValue(lessons);

      const result = await controller.findAll();

      expect(lessonsServiceStub.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(lessons);
    });
  });

  describe('remove', () => {
    it('debe delegar en LessonsService.remove y retornar el resultado', async () => {
      const deleted = { id: 5, title: 'L5' };
      (lessonsServiceStub.remove as jest.Mock).mockResolvedValue(deleted);

      const result = await controller.remove(5);

      expect(lessonsServiceStub.remove).toHaveBeenCalledWith(5);
      expect(result).toEqual(deleted);
    });
  });
});
