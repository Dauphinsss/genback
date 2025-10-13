// src/lessons/lessons.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LessonsService {
  constructor(private readonly prismaService: PrismaService) {}

  // Crear una nueva lección
  async create(createLessonDto: CreateLessonDto) {
    const unitExists = await this.prismaService.unit.findUnique({
      where: { id: createLessonDto.unitId },
    });

    if (!unitExists) {
      throw new NotFoundException(
        `No se encontró la unidad con ID ${createLessonDto.unitId}.`,
      );
    }

    // Verificar si ya existe una lección
    const existingLesson = await this.prismaService.lesson.findFirst({
      where: {
        unitId: createLessonDto.unitId,
        index: createLessonDto.index,
      },
    });

    if (existingLesson) {
      throw new ConflictException(
        `Ya existe una lección con el índice ${createLessonDto.index} en la unidad ${createLessonDto.unitId}.`,
      );
    }

    // Crear leccion
    try {
      return await this.prismaService.lesson.create({
        data: createLessonDto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe una lección con este título.');
      }
      throw error;
    }
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
      throw new NotFoundException(`No se encontró la lección con ID ${id}.`);
    }

    return this.prismaService.lesson.delete({ where: { id } });
  }
}
