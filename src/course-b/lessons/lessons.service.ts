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

  async getAllLessons(unitId: number) {
    return this.prisma.lesson.findMany({
      where: { unitId },
      include: {
        lessonTopics: {
          include: {
            topic: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: { index: 'asc' },
    });
  }

  async getLessonById(id: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        unit: {
          include: {
            courseBase: true,
          },
        },
        lessonTopics: {
          include: {
            topic: {
              include: {
                content: {
                  include: {
                    resources: true,
                  },
                },
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
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

    // REGLA: Solo se pueden editar cursos INACTIVOS
    if (unit.courseBase.status === 'activo') {
      throw new BadRequestException(
        'No se puede editar un curso activo. Los cursos activos están en uso por profesores y estudiantes.',
      );
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
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { unit: { include: { courseBase: true } } },
    });
    if (!lesson) throw new NotFoundException('Lección no encontrada');

    // REGLA: Solo se pueden editar cursos INACTIVOS
    if (lesson.unit.courseBase.status === 'activo') {
      throw new BadRequestException(
        'No se puede editar un curso activo. Los cursos activos están en uso por profesores y estudiantes.',
      );
    }

    return this.prisma.lesson.update({
      where: { id },
      data,
    });
  }

  async deleteLesson(id: number): Promise<Lesson> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { unit: { include: { courseBase: true } } },
    });
    if (!lesson) throw new NotFoundException('Lección no encontrada');

    // REGLA: Solo se pueden editar cursos INACTIVOS
    if (lesson.unit.courseBase.status === 'activo') {
      throw new BadRequestException(
        'No se puede eliminar lecciones de un curso activo. Los cursos activos están en uso por profesores y estudiantes.',
      );
    }

    return this.prisma.lesson.delete({ where: { id } });
  }

  // Asociar un topic a una lección
  async associateTopicToLesson(
    lessonId: number,
    topicId: number,
    order?: number,
  ) {
    // Verificar que la lección existe
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { unit: { include: { courseBase: true } } },
    });
    if (!lesson) throw new NotFoundException('Lección no encontrada');

    // REGLA: Solo se pueden editar cursos INACTIVOS
    if (lesson.unit.courseBase.status === 'activo') {
      throw new BadRequestException(
        'No se puede editar un curso activo. Los cursos activos están en uso por profesores y estudiantes.',
      );
    }

    // Verificar que el topic existe
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });
    if (!topic) throw new NotFoundException('Topic no encontrado');

    // Verificar si ya existe la asociación
    const existing = await this.prisma.lessonTopic.findUnique({
      where: {
        lessonId_topicId: {
          lessonId,
          topicId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('El topic ya está asociado a esta lección');
    }

    // Crear la asociación
    return this.prisma.lessonTopic.create({
      data: {
        lessonId,
        topicId,
        order: order ?? 0,
      },
      include: {
        topic: {
          include: {
            content: {
              include: {
                resources: true,
              },
            },
          },
        },
      },
    });
  }

  // Desasociar un topic de una lección
  async dissociateTopicFromLesson(lessonId: number, topicId: number) {
    // Verificar que la lección existe y obtener el curso base
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { unit: { include: { courseBase: true } } },
    });
    if (!lesson) throw new NotFoundException('Lección no encontrada');

    // REGLA: Solo se pueden editar cursos INACTIVOS
    if (lesson.unit.courseBase.status === 'activo') {
      throw new BadRequestException(
        'No se puede editar un curso activo. Los cursos activos están en uso por profesores y estudiantes.',
      );
    }

    const lessonTopic = await this.prisma.lessonTopic.findUnique({
      where: {
        lessonId_topicId: {
          lessonId,
          topicId,
        },
      },
    });

    if (!lessonTopic) {
      throw new NotFoundException('Asociación no encontrada');
    }

    return this.prisma.lessonTopic.delete({
      where: {
        lessonId_topicId: {
          lessonId,
          topicId,
        },
      },
    });
  }

  // Obtener todos los topics de una lección
  async getTopicsByLesson(lessonId: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) throw new NotFoundException('Lección no encontrada');

    return this.prisma.lessonTopic.findMany({
      where: { lessonId },
      include: {
        topic: {
          include: {
            content: {
              include: {
                resources: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  // Actualizar el orden de un topic en una lección
  async updateTopicOrder(lessonId: number, topicId: number, order: number) {
    // Verificar que la lección existe y obtener el curso base
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { unit: { include: { courseBase: true } } },
    });
    if (!lesson) throw new NotFoundException('Lección no encontrada');

    // REGLA: Solo se pueden editar cursos INACTIVOS
    if (lesson.unit.courseBase.status === 'activo') {
      throw new BadRequestException(
        'No se puede editar un curso activo. Los cursos activos están en uso por profesores y estudiantes.',
      );
    }

    const lessonTopic = await this.prisma.lessonTopic.findUnique({
      where: {
        lessonId_topicId: {
          lessonId,
          topicId,
        },
      },
    });

    if (!lessonTopic) {
      throw new NotFoundException('Asociación no encontrada');
    }

    return this.prisma.lessonTopic.update({
      where: {
        lessonId_topicId: {
          lessonId,
          topicId,
        },
      },
      data: {
        order,
      },
      include: {
        topic: true,
      },
    });
  }
}
