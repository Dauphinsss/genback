import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CourseBService {
  constructor(private readonly prisma: PrismaService) {}

  async createCourse(
    title: string,
    status: 'activo' | 'inactivo' | 'historico' = 'activo',
  ) {
    if (status === 'inactivo') {
      const existingInactive = await this.prisma.courseBase.findFirst({
        where: { status: 'inactivo' },
      });
      if (existingInactive) {
        throw new Error('Ya existe un curso inactivo. No se puede crear otro.');
      }
    }
    if (status === 'activo') {
      const existingActive = await this.prisma.courseBase.findFirst({
        where: { status: 'activo' },
      });
      if (existingActive) {
        throw new Error('Ya existe un curso activo. No se puede crear otro.');
      }
    }
    return this.prisma.courseBase.create({
      data: { title, status },
    });
  }

  // GET /courses -> todos
  async getAllCourses() {
    return this.prisma.courseBase.findMany();
  }

  // GET /courses/active -> solo activos
  async getActiveCourses() {
    return this.prisma.courseBase.findMany({
      where: { status: 'activo' },
    });
  }

  //GET /courses?status=activo|inactivo
  async getByStatus(status: 'activo' | 'inactivo' | 'historico') {
    return this.prisma.courseBase.findMany({ where: { status } });
  }

  async getInactiveCourse() {
    return this.prisma.courseBase.findFirst({ where: { status: 'inactivo' } });
  }

  async getHistoricCourses() {
    return this.prisma.courseBase.findMany({ where: { status: 'historico' } });
  }

  // GET /courses/:id
  async getById(id: number) {
    return this.prisma.courseBase.findUnique({ where: { id } });
  }

  // GET /courses/active/full -> Curso activo con todas sus unidades, lecciones y tópicos
  async getActiveCourseWithContent() {
    const activeCourse = await this.prisma.courseBase.findFirst({
      where: { status: 'activo' },
      include: {
        units: {
          orderBy: { index: 'asc' },
          include: {
            lessons: {
              orderBy: { index: 'asc' },
              include: {
                lessonTopics: {
                  orderBy: { order: 'asc' },
                  include: {
                    topic: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!activeCourse) {
      throw new Error('No existe un curso base activo');
    }

    return activeCourse;
  }

  // POST /courses/:id/clone -> Crea una copia completa del curso base
  async cloneActiveToInactive() {
    const activeCourse = await this.prisma.courseBase.findFirst({
      where: { status: 'activo' },
      include: {
        units: {
          orderBy: { index: 'asc' },
          include: {
            lessons: {
              orderBy: { index: 'asc' },
              include: {
                lessonTopics: {
                  orderBy: { order: 'asc' },
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
                },
              },
            },
          },
        },
      },
    });
    if (!activeCourse) throw new Error('No existe curso activo para clonar');
    const existingInactive = await this.prisma.courseBase.findFirst({
      where: { status: 'inactivo' },
    });
    if (existingInactive)
      throw new Error('Ya existe un curso inactivo. No se puede crear otro.');
    const topicIdMap = new Map<number, number>();

    const uniqueTopicIds = new Set<number>();
    activeCourse.units.forEach((unit) => {
      unit.lessons.forEach((lesson) => {
        lesson.lessonTopics.forEach((lt) => {
          uniqueTopicIds.add(lt.topicId);
        });
      });
    });
    for (const originalTopicId of uniqueTopicIds) {
      const originalTopic = await this.prisma.topic.findUnique({
        where: { id: originalTopicId },
        include: {
          content: { include: { resources: true } },
        },
      });
      if (originalTopic) {
        const clonedTopic = await this.prisma.topic.create({
          data: {
            name: originalTopic.name,
            type: originalTopic.type,
            content: originalTopic.content
              ? {
                  create: {
                    jsonFileUrl: originalTopic.content.jsonFileUrl,
                    description: originalTopic.content.description,
                    resources: {
                      create: originalTopic.content.resources.map(
                        (resource) => ({
                          filename: resource.filename,
                          resourceUrl: resource.resourceUrl,
                          type: resource.type,
                          size: resource.size,
                          mimeType: resource.mimeType,
                        }),
                      ),
                    },
                  },
                }
              : undefined,
          },
        });
        topicIdMap.set(originalTopicId, clonedTopic.id);
      }
    }
    const clonedCourse = await this.prisma.courseBase.create({
      data: {
        title: `${activeCourse.title} (Copia)`,
        status: 'inactivo',
        units: {
          create: activeCourse.units.map((unit) => ({
            title: unit.title,
            index: unit.index,
            published: unit.published,
            lessons: {
              create: unit.lessons.map((lesson) => ({
                title: lesson.title,
                index: lesson.index,
                duration: lesson.duration,
                content: lesson.content,
                lessonTopics: {
                  create: lesson.lessonTopics.map((lt) => ({
                    topicId: topicIdMap.get(lt.topicId) || lt.topicId,
                    order: lt.order,
                  })),
                },
              })),
            },
          })),
        },
      },
      include: {
        units: {
          include: {
            lessons: {
              include: {
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
                },
              },
            },
          },
        },
      },
    });
    return {
      message: 'Copia del curso creada exitosamente',
      clonedTopicsCount: topicIdMap.size,
      originalCourse: {
        id: activeCourse.id,
        title: activeCourse.title,
        status: activeCourse.status,
      },
      clonedCourse,
    };
  }

  // PATCH /courses/activate -> Activa el curso inactivo y pasa el activo a histórico
  async activateInactiveCourse() {
    const inactive = await this.prisma.courseBase.findFirst({
      where: { status: 'inactivo' },
    });
    if (!inactive) throw new Error('No existe curso inactivo para activar');
    const active = await this.prisma.courseBase.findFirst({
      where: { status: 'activo' },
    });
    if (active) {
      await this.prisma.courseBase.update({
        where: { id: active.id },
        data: { status: 'historico' },
      });
    }
    const activated = await this.prisma.courseBase.update({
      where: { id: inactive.id },
      data: { status: 'activo' },
    });
    return { message: 'Curso inactivo activado', activated };
  }

  // PATCH /courses/:id -> Actualiza el curso (no permite editar históricos)
  async updateCourse(id: number, data: { title?: string }) {
    const course = await this.prisma.courseBase.findUnique({ where: { id } });
    if (!course) throw new Error('Curso no encontrado');
    if (course.status === 'historico')
      throw new Error('No se puede editar un curso histórico');
    return this.prisma.courseBase.update({ where: { id }, data });
  }

  // GET /courses/:id/full -> Curso con todo su contenido (unidades, lecciones, topics, etc)
  async getCourseWithContent(id: number) {
    const course = await this.prisma.courseBase.findUnique({
      where: { id },
      include: {
        units: {
          orderBy: { index: 'asc' },
          include: {
            lessons: {
              orderBy: { index: 'asc' },
              include: {
                lessonTopics: {
                  orderBy: { order: 'asc' },
                  include: {
                    topic: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!course) throw new Error('Curso no encontrado');
    return course;
  }
}
