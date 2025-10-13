import { Test, TestingModule } from '@nestjs/testing';
import { LessonsService } from './lessons.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateLessonDto } from './dto/create-lesson.dto';

describe('LessonsService', () => {
  let service: LessonsService;
  let prisma: {
    unit: { findUnique: jest.Mock };
    lesson: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      unit: { findUnique: jest.fn() },
      lesson: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonsService,
        {
          provide: PrismaService,
          useValue: prisma as unknown as PrismaService,
        },
      ],
    }).compile();

    service = module.get<LessonsService>(LessonsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('lanza NotFoundException si la unidad no existe', async () => {
      const dto: CreateLessonDto = {
        title: 'L1',
        index: 1,
        published: true,
        unitId: 99,
      };
      prisma.unit.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.unit.findUnique).toHaveBeenCalledWith({
        where: { id: 99 },
      });
    });

    it('lanza ConflictException si ya existe una lección con mismo unitId e index', async () => {
      const dto: CreateLessonDto = {
        title: 'L1',
        index: 1,
        published: true,
        unitId: 1,
      };
      prisma.unit.findUnique.mockResolvedValue({ id: 1 });
      prisma.lesson.findFirst.mockResolvedValue({ id: 5 });

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.lesson.findFirst).toHaveBeenCalledWith({
        where: { unitId: 1, index: 1 },
      });
    });

    it('crea una lección si la unidad existe y no hay duplicados', async () => {
      const dto: CreateLessonDto = {
        title: 'Nueva lección',
        index: 2,
        published: true,
        unitId: 1,
      };
      const created = { id: 10, ...dto };

      prisma.unit.findUnique.mockResolvedValue({ id: 1 });
      prisma.lesson.findFirst.mockResolvedValue(null);
      prisma.lesson.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(prisma.unit.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(prisma.lesson.findFirst).toHaveBeenCalledWith({
        where: { unitId: 1, index: 2 },
      });
      expect(prisma.lesson.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(created);
    });
  });

  describe('findAll', () => {
    it('devuelve todas las lecciones', async () => {
      const lessons = [
        { id: 1, title: 'L1' },
        { id: 2, title: 'L2' },
      ];
      prisma.lesson.findMany.mockResolvedValue(lessons);

      const result = await service.findAll();

      expect(prisma.lesson.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(lessons);
    });
  });

  describe('remove', () => {
    it('lanza NotFoundException si la lección no existe', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);

      await expect(service.remove(50)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: 50 },
      });
    });

    it('borra la lección si existe', async () => {
      const lesson = { id: 5, title: 'Borrar' };
      prisma.lesson.findUnique.mockResolvedValue(lesson);
      prisma.lesson.delete.mockResolvedValue(lesson);

      const result = await service.remove(5);

      expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: 5 },
      });
      expect(prisma.lesson.delete).toHaveBeenCalledWith({ where: { id: 5 } });
      expect(result).toEqual(lesson);
    });
  });
});
