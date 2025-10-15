import { Test, TestingModule } from '@nestjs/testing';
import { CourseBController } from './course-b.controller';
import { CourseBService } from './course-b.service';

describe('CourseBController', () => {
  let controller: CourseBController;
  let service: CourseBService;

  const cursoMock = { id: 1, title: 'Curso de prueba', status: 'activo' };

  const serviceMock = {
    createCourse: jest.fn((title: string, status?: 'activo' | 'inactivo') => ({
      id: 1,
      title,
      status: status || 'activo',
    })),
    getAllCourses: jest.fn(() => [cursoMock]),
    getByStatus: jest.fn((status: 'activo' | 'inactivo') => [
      { ...cursoMock, status },
    ]),
    getActiveCourses: jest.fn(() => [cursoMock]),
    getById: jest.fn((id: number) => ({ ...cursoMock, id })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourseBController],
      providers: [{ provide: CourseBService, useValue: serviceMock }],
    }).compile();

    controller = module.get<CourseBController>(CourseBController);
    service = module.get<CourseBService>(CourseBService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- TESTS ---

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debería crear un curso con status por defecto "activo"', async () => {
      const result = await controller.create({ title: 'Nuevo curso' });
      expect(service.createCourse).toHaveBeenCalledWith(
        'Nuevo curso',
        undefined,
      );
      expect(result).toEqual({ id: 1, title: 'Nuevo curso', status: 'activo' });
    });

    it('debería crear un curso con status "inactivo"', async () => {
      const result = await controller.create({
        title: 'Otro curso',
        status: 'inactivo',
      });
      expect(service.createCourse).toHaveBeenCalledWith(
        'Otro curso',
        'inactivo',
      );
      expect(result.status).toBe('inactivo');
    });
  });

  describe('findAll', () => {
    it('debería devolver todos los cursos si no hay filtro', async () => {
      const result = await controller.findAll();
      expect(service.getAllCourses).toHaveBeenCalled();
      expect(result).toEqual([cursoMock]);
    });

    it('debería devolver cursos filtrados por status', async () => {
      const result = await controller.findAll('inactivo');
      expect(service.getByStatus).toHaveBeenCalledWith('inactivo');
      expect(result[0].status).toBe('inactivo');
    });
  });

  describe('active', () => {
    it('debería devolver solo cursos activos', async () => {
      const result = await controller.active();
      expect(service.getActiveCourses).toHaveBeenCalled();
      expect(result).toEqual([cursoMock]);
    });
  });

  describe('findOne', () => {
    it('debería devolver el curso por ID', async () => {
      const result = await controller.findOne(5);
      expect(service.getById).toHaveBeenCalledWith(5);
      expect(result.id).toBe(5);
    });
  });
});
