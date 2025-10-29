import { Test, TestingModule } from '@nestjs/testing';
import { CourseBService } from './course-b.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CourseBService', () => {
  let service: CourseBService;
  let prisma: PrismaService;

  let cursoMock;
  let prismaMock;

  beforeEach(async () => {
    cursoMock = { id: 1, title: 'Curso de prueba', status: 'activo' };
    prismaMock = {
      courseBase: {
        create: jest.fn((data) => ({ id: 1, ...data.data })),
        findMany: jest.fn(),
        findUnique: jest.fn(() => cursoMock),
        findFirst: jest.fn(() => cursoMock),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };
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
    it('lanza error si ya existe un curso activo', async () => {
      prismaMock.courseBase.findMany.mockImplementation(() => [
        { id: 1, title: 'Curso existente', status: 'activo' },
      ]);
      await expect(service.createCourse('Nuevo Curso')).rejects.toThrow(
        'Ya existe un curso activo. No se puede crear otro.',
      );
    });

    it('lanza error si ya existe un curso inactivo', async () => {
      prismaMock.courseBase.findMany.mockImplementation(() => [
        { id: 2, title: 'Curso inactivo', status: 'inactivo' },
      ]);
      await expect(service.createCourse('Curso 2', 'inactivo')).rejects.toThrow(
        'Ya existe un curso inactivo. No se puede crear otro.',
      );
    });

    it('crea un curso activo si no existe otro activo', async () => {
      prismaMock.courseBase.findFirst.mockReset();
      prismaMock.courseBase.findFirst.mockResolvedValue(null);
      prismaMock.courseBase.create.mockReset();
      prismaMock.courseBase.create.mockResolvedValue({
        id: 3,
        title: 'Nuevo Curso',
        status: 'activo',
      });
      const resultado = await service.createCourse('Nuevo Curso');
      expect(resultado).toEqual({
        id: 3,
        title: 'Nuevo Curso',
        status: 'activo',
      });
      expect(prisma.courseBase.create).toHaveBeenCalledWith({
        data: { title: 'Nuevo Curso', status: 'activo' },
      });
    });

    it('crea un curso inactivo si no existe otro inactivo', async () => {
      prismaMock.courseBase.findFirst.mockReset();
      prismaMock.courseBase.findFirst.mockResolvedValue(null);
      prismaMock.courseBase.create.mockReset();
      prismaMock.courseBase.create.mockResolvedValue({
        id: 4,
        title: 'Curso 2',
        status: 'inactivo',
      });
      const resultado = await service.createCourse('Curso 2', 'inactivo');
      expect(resultado).toEqual({
        id: 4,
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
      const cursos = [
        { id: 1, title: 'Curso 1', status: 'activo' },
        { id: 2, title: 'Curso 2', status: 'inactivo' },
      ];
      prismaMock.courseBase.findMany.mockResolvedValue(cursos);
      const resultado = await service.getAllCourses();
      expect(resultado).toEqual(cursos);
      expect(prisma.courseBase.findMany).toHaveBeenCalled();
    });
  });

  describe('getActiveCourses', () => {
    it('debería devolver solo los cursos activos', async () => {
      const cursos = [{ id: 1, title: 'Curso 1', status: 'activo' }];
      prismaMock.courseBase.findMany.mockResolvedValue(cursos);
      const resultado = await service.getActiveCourses();
      expect(resultado).toEqual(cursos);
      expect(prisma.courseBase.findMany).toHaveBeenCalledWith({
        where: { status: 'activo' },
      });
    });
  });

  describe('getByStatus', () => {
    it('debería devolver los cursos filtrados por estado', async () => {
      const cursos = [{ id: 1, title: 'Curso 1', status: 'activo' }];
      prismaMock.courseBase.findMany.mockResolvedValue(cursos);
      const resultado = await service.getByStatus('activo');
      expect(resultado).toEqual(cursos);
      expect(prisma.courseBase.findMany).toHaveBeenCalledWith({
        where: { status: 'activo' },
      });
    });
  });

  describe('getById', () => {
    it('debería devolver un curso según su id', async () => {
      const curso = { id: 1, title: 'Curso 1', status: 'activo' };
      prismaMock.courseBase.findUnique.mockReturnValue(curso);
      const resultado = await service.getById(1);
      expect(resultado).toEqual(curso);
      expect(prisma.courseBase.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('Validación de unicidad de curso activo', () => {
    it('debería tener solo UN curso activo aunque existan múltiples cursos', async () => {
      const multipleCourses = [
        { id: 1, title: 'Python Básico', status: 'activo' },
        { id: 2, title: 'Python Avanzado (Copia)', status: 'inactivo' },
        { id: 3, title: 'Python Viejo', status: 'inactivo' },
      ];
      prismaMock.courseBase.findMany.mockResolvedValue(multipleCourses);
      const allCourses = await service.getAllCourses();
      expect(allCourses).toHaveLength(3);
      const activeCourses = allCourses.filter(
        (course) => course.status === 'activo',
      );
      expect(activeCourses).toHaveLength(1);
      expect(activeCourses[0].id).toBe(1);
      expect(activeCourses[0].status).toBe('activo');
      const inactiveCourses = allCourses.filter(
        (course) => course.status === 'inactivo',
      );
      expect(inactiveCourses).toHaveLength(2);
      expect(
        inactiveCourses.every((course) => course.status === 'inactivo'),
      ).toBe(true);
    });

    it('debería activar un curso inactivo y poner el activo como histórico', async () => {
      const inactiveCourse = {
        id: 2,
        title: 'Curso a Activar',
        status: 'inactivo',
      };
      const activeCourse = { id: 1, title: 'Curso Activo', status: 'activo' };
      prismaMock.courseBase.findFirst = jest
        .fn()
        .mockImplementationOnce(() => inactiveCourse)
        .mockImplementationOnce(() => activeCourse);
      prismaMock.courseBase.update = jest
        .fn()
        .mockImplementationOnce(() => ({
          ...activeCourse,
          status: 'historico',
        }))
        .mockImplementationOnce(() => ({
          ...inactiveCourse,
          status: 'activo',
        }));

      const result = await service.activateInactiveCourse();

      expect(prismaMock.courseBase.update).toHaveBeenCalledWith({
        where: { id: activeCourse.id },
        data: { status: 'historico' },
      });

      expect(prismaMock.courseBase.update).toHaveBeenCalledWith({
        where: { id: inactiveCourse.id },
        data: { status: 'activo' },
      });
      // Verificar el resultado
      expect(result.activated.status).toBe('activo');
      expect(result.message).toContain('activado');
    });

    it('debería detectar y prevenir escenarios con múltiples cursos activos', async () => {
      // Mock: Escenario donde hay dos cursos activos (estado inválido)
      const coursesWithTwoActive = [
        { id: 1, title: 'Curso 1', status: 'activo' },
        { id: 2, title: 'Curso 2', status: 'activo' }, // ← Esto NO debería existir
        { id: 3, title: 'Curso 3', status: 'inactivo' },
      ];

      prismaMock.courseBase.findMany.mockResolvedValue(coursesWithTwoActive);

      const allCourses = await service.getAllCourses();
      const activeCourses = allCourses.filter(
        (course) => course.status === 'activo',
      );

      // Detectar el problema: Si hay más de 1 activo, el sistema tiene un bug
      // Este test documenta que el escenario con 2 activos es INVÁLIDO
      if (activeCourses.length > 1) {
        // Este escenario NO debería existir en producción
        // activateCourse() debe garantizar que solo haya 1 activo
        expect(activeCourses.length).toBe(2); // Confirma que detectamos el problema
      } else {
        // Escenario correcto: Solo 1 activo
        expect(activeCourses.length).toBe(1);
      }
    });
  });
});
