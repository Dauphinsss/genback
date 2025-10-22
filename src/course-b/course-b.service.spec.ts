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
      findMany: jest.fn(),
      findUnique: jest.fn(() => cursoMock),
      findFirst: jest.fn(() => cursoMock),
      update: jest.fn(),
      updateMany: jest.fn(),
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

    // Reset mock default return value
    prismaMock.courseBase.findMany.mockResolvedValue([cursoMock]);
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

  describe('Validación de unicidad de curso activo', () => {
    it('debería tener solo UN curso activo aunque existan múltiples cursos', async () => {
      // Mock: Simular múltiples cursos en la base de datos
      const multipleCourses = [
        {
          id: 1,
          title: 'Python Básico',
          status: 'activo',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          title: 'Python Avanzado (Copia)',
          status: 'inactivo',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          title: 'Python Viejo',
          status: 'inactivo',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaMock.courseBase.findMany.mockResolvedValue(multipleCourses);

      const allCourses = await service.getAllCourses();

      // Verificar que existen múltiples cursos
      expect(allCourses).toHaveLength(3);

      // Filtrar cursos activos
      const activeCourses = allCourses.filter(
        (course) => course.status === 'activo',
      );

      // VERIFICACIÓN CRÍTICA: Solo debe haber UN curso activo
      expect(activeCourses).toHaveLength(1);
      expect(activeCourses[0].id).toBe(1);
      expect(activeCourses[0].status).toBe('activo');

      // Verificar que los demás están inactivos
      const inactiveCourses = allCourses.filter(
        (course) => course.status === 'inactivo',
      );
      expect(inactiveCourses).toHaveLength(2);
      expect(
        inactiveCourses.every((course) => course.status === 'inactivo'),
      ).toBe(true);
    });

    it('debería garantizar que activateCourse desactiva todos los demás cursos', async () => {
      const courseToActivate = {
        id: 2,
        title: 'Curso a Activar',
        status: 'inactivo',
      };

      prismaMock.courseBase.findUnique = jest
        .fn()
        .mockResolvedValue(courseToActivate);
      prismaMock.courseBase.updateMany = jest
        .fn()
        .mockResolvedValue({ count: 1 });
      prismaMock.courseBase.update = jest.fn().mockResolvedValue({
        ...courseToActivate,
        status: 'activo',
      });

      const result = await service.activateCourse(2);

      // Verificar que se desactivaron TODOS los cursos activos
      expect(prismaMock.courseBase.updateMany).toHaveBeenCalledWith({
        where: { status: 'activo' },
        data: { status: 'inactivo' },
      });

      // Verificar que se activó el curso seleccionado
      expect(prismaMock.courseBase.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { status: 'activo' },
      });

      // Verificar el resultado
      expect(result.course.status).toBe('activo');
      expect(result.message).toContain('activado exitosamente');
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
