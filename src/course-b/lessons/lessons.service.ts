import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Lesson } from '@prisma/client';

interface CreateLessonDto {
  title: string;
  index: number;
  unitId: number;
}

interface UpdateLessonDto {
  title?: string;
  index?: number;
}

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async getAllLessons(unitId: number): Promise<Lesson[]> {
    return this.prisma.lesson.findMany({
      where: { unitId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getLessonById(id: number): Promise<Lesson> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { lessonTopics: true },
    });
    if (!lesson) throw new NotFoundException('Lección no encontrada');
    return lesson;
  }

  async createLesson(data: CreateLessonDto): Promise<Lesson> {
    const unit = await this.prisma.unit.findUnique({
      where: { id: data.unitId },
      include: { courseBase: true },
    });
    if (!unit) throw new NotFoundException('Unidad no encontrada');

    if (unit.courseBase?.status !== 'activo') {
      throw new BadRequestException('El curso asociado no está activo');
    }

    return this.prisma.lesson.create({
      data: {
        title: data.title,
        index: data.index,
        unitId: data.unitId,
      },
    });
  }

  async updateLesson(id: number, data: UpdateLessonDto): Promise<Lesson> {
    const exists = await this.prisma.lesson.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Lección no encontrada');

    return this.prisma.lesson.update({
      where: { id },
      data,
    });
  }

  async deleteLesson(id: number): Promise<Lesson> {
    const exists = await this.prisma.lesson.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Lección no encontrada');

    return this.prisma.lesson.delete({ where: { id } });
  }
}
