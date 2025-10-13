// src/lessons/lessons.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(private readonly prismaService: PrismaService) {}

  // Crear una nueva lección
  async create(createLessonDto: CreateLessonDto) {
    const unitExists = await this.prismaService.unit.findUnique({
      where: { id: createLessonDto.unitId },
    });

    // Si la unidad no existe
    if (!unitExists) {
      throw new NotFoundException(
        `Unit with ID ${createLessonDto.unitId} not found.`,
      );
    }

    // Verificar si ya existe una leccion
    const existingLesson = await this.prismaService.lesson.findFirst({
      where: {
        unitId: createLessonDto.unitId,
        index: createLessonDto.index,
      },
    });

    if (existingLesson) {
      throw new ConflictException(
        `A lesson with unitId ${createLessonDto.unitId} and index ${createLessonDto.index} already exists.`,
      );
    }

    return this.prismaService.lesson.create({
      data: createLessonDto,
    });
  }

  // Obtener todas las lecciones
  async findAll() {
    return this.prismaService.lesson.findMany();
  }

  // Eliminar lecciones
  async remove(id: number) {
    const lesson = await this.prismaService.lesson.findUnique({
      where: { id },
    });
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found.`);
    }
    return this.prismaService.lesson.delete({ where: { id } });
  }
}
