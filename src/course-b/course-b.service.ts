import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CourseBService {
  constructor(private readonly prisma: PrismaService) {}

  async createCourse(title: string, status: 'activo' | 'inactivo' = 'activo') {
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
  async getByStatus(status: 'activo' | 'inactivo') {
    return this.prisma.courseBase.findMany({ where: { status } });
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

  // GET /courses/editable -> Obtiene el curso que se puede editar (inactivo si existe activo, o el activo si no hay cursos activos)
  async getEditableCourse() {
    // Primero verificar si existe un curso activo
    const activeCourse = await this.prisma.courseBase.findFirst({
      where: { status: 'activo' },
    });

    if (activeCourse) {
      // Si existe curso activo, buscar uno inactivo para editar
      const inactiveCourse = await this.prisma.courseBase.findFirst({
        where: { status: 'inactivo' },
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

      return {
        hasActiveCourse: true,
        activeCourseId: activeCourse.id,
        editableCourse: inactiveCourse,
        canEditDirectly: false,
        message: inactiveCourse
          ? 'Existe un curso activo. Editando curso inactivo.'
          : 'Existe un curso activo. Debes crear una copia para editar.',
      };
    }

    // Si no hay curso activo, el único curso (probablemente inactivo) se puede editar directamente
    const course = await this.prisma.courseBase.findFirst({
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

    return {
      hasActiveCourse: false,
      activeCourseId: null,
      editableCourse: course,
      canEditDirectly: true,
      message:
        'No hay cursos activos. Puedes editar directamente el curso base.',
    };
  }

  // POST /courses/:id/clone -> Crea una copia completa del curso base (espejo/temporal)
  async cloneCourse(courseId: number) {
    // Obtener el curso original con TODO su contenido (incluyendo topics, content, resources)
    const originalCourse = await this.prisma.courseBase.findUnique({
      where: { id: courseId },
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

    if (!originalCourse) {
      throw new Error('Curso no encontrado');
    }

    // Mapa para trackear los topics originales y sus clones (oldTopicId -> newTopicId)
    const topicIdMap = new Map<number, number>();

    // PASO 1: Clonar todos los Topics únicos del curso con su Content y Resources
    const uniqueTopicIds = new Set<number>();
    originalCourse.units.forEach((unit) => {
      unit.lessons.forEach((lesson) => {
        lesson.lessonTopics.forEach((lt) => {
          uniqueTopicIds.add(lt.topicId);
        });
      });
    });

    // Clonar cada topic único
    for (const originalTopicId of uniqueTopicIds) {
      const originalTopic = await this.prisma.topic.findUnique({
        where: { id: originalTopicId },
        include: {
          content: {
            include: {
              resources: true,
            },
          },
        },
      });

      if (originalTopic) {
        // Crear el topic clonado con su content y resources
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

        // Guardar el mapeo: ID original -> ID clonado
        topicIdMap.set(originalTopicId, clonedTopic.id);
      }
    }

    // PASO 2: Crear el nuevo curso con sus unidades, lecciones y lessonTopics apuntando a los topics clonados
    const clonedCourse = await this.prisma.courseBase.create({
      data: {
        title: `${originalCourse.title} (Copia)`,
        status: 'inactivo',
        units: {
          create: originalCourse.units.map((unit) => ({
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
                    topicId: topicIdMap.get(lt.topicId) || lt.topicId, // Usar el topic clonado
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
        id: originalCourse.id,
        title: originalCourse.title,
        status: originalCourse.status,
      },
      clonedCourse,
    };
  }

  // PATCH /courses/:id/activate -> Activa un curso y desactiva todos los demás
  async activateCourse(courseId: number) {
    const course = await this.prisma.courseBase.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new Error('Curso no encontrado');
    }

    // Desactivar todos los cursos
    await this.prisma.courseBase.updateMany({
      where: { status: 'activo' },
      data: { status: 'inactivo' },
    });

    // Activar el curso seleccionado
    const activatedCourse = await this.prisma.courseBase.update({
      where: { id: courseId },
      data: { status: 'activo' },
    });

    return {
      message: `Curso "${activatedCourse.title}" activado exitosamente`,
      course: activatedCourse,
    };
  }

  // PATCH /courses/:id -> Actualizar título del curso
  async updateCourse(courseId: number, data: { title?: string }) {
    return this.prisma.courseBase.update({
      where: { id: courseId },
      data,
    });
  }
}
