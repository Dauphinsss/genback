import { Test, TestingModule } from '@nestjs/testing';
import { CourseBService } from './course-b.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CourseBService', () => {
  let service: CourseBService;
  let prisma: PrismaService;

  const cursoMock = { id: 1, title: 'Curso de prueba', status: 'activo' };

  const prismaMock = {
    courseBase: {
      create: jest.fn((data) => ({ id: 1, ...data.data })),
      findMany: jest.fn(() => [cursoMock]),
      findUnique: jest.fn(() => cursoMock),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseBService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CourseBService>(CourseBService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('createCourse', () => {
    it('debería crear un curso con estado por defecto', async () => {
      const resultado = await service.createCourse('Nuevo Curso');
      expect(resultado).toEqual({
        id: 1,
        title: 'Nuevo Curso',
        status: 'activo',
      });
      expect(prisma.courseBase.create).toHaveBeenCalledWith({
        data: { title: 'Nuevo Curso', status: 'activo' },
      });
    });

    it('debería crear un curso con el estado proporcionado', async () => {
      const resultado = await service.createCourse('Curso 2', 'inactivo');
      expect(resultado).toEqual({
        id: 1,
        title: 'Curso 2',
        status: 'inactivo',
      });
      expect(prisma.courseBase.create).toHaveBeenCalledWith({
        data: { title: 'Curso 2', status: 'inactivo' },
      });
    });
  });

  describe('getAllCourses', () => {
    it('debería devolver todos los cursos', async () => {
      const resultado = await service.getAllCourses();
      expect(resultado).toEqual([cursoMock]);
      expect(prisma.courseBase.findMany).toHaveBeenCalled();
    });
  });

  describe('getActiveCourses', () => {
    it('debería devolver solo los cursos activos', async () => {
      const resultado = await service.getActiveCourses();
      expect(resultado).toEqual([cursoMock]);
      expect(prisma.courseBase.findMany).toHaveBeenCalledWith({
        where: { status: 'activo' },
      });
    });
  });

  describe('getByStatus', () => {
    it('debería devolver los cursos filtrados por estado', async () => {
      const resultado = await service.getByStatus('activo');
      expect(resultado).toEqual([cursoMock]);
      expect(prisma.courseBase.findMany).toHaveBeenCalledWith({
        where: { status: 'activo' },
      });
    });
  });

  describe('getById', () => {
    it('debería devolver un curso según su id', async () => {
      const resultado = await service.getById(1);
      expect(resultado).toEqual(cursoMock);
      expect(prisma.courseBase.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
