import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  // Unirse a curso (estudiantes)
  async joinCourse(studentId: number, courseCode: string) {
    // Verificar que el curso existe
    const course = await this.prisma.course.findUnique({
      where: { code: courseCode },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Verificar que el estudiante no sea el profesor
    if (course.id_teacher === studentId) {
      throw new ConflictException(
        'Teachers cannot join their own courses as students',
      );
    }

    // Verificar que no esté ya inscrito
    const existingEnrollment = await this.prisma.courseStudent.findFirst({
      where: {
        id_course: course.id,
        id_student: studentId,
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('Already enrolled in this course');
    }

    // Crear la inscripción
    return this.prisma.courseStudent.create({
      data: {
        id_course: course.id,
        id_student: studentId,
      },
      include: {
        course: {
          select: { id: true, code: true },
          include: {
            teacher: {
              select: { name: true, email: true, avatar: true },
            },
          },
        },
        student: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  // Obtener cursos del usuario
  async getUserCourses(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        teachingCourses: {
          include: {
            students: {
              include: {
                student: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
        enrolledCourses: {
          include: {
            course: {
              include: {
                teacher: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      teachingCourses: user.teachingCourses,
      enrolledCourses: user.enrolledCourses.map((enrollment) => ({
        ...enrollment.course,
        enrollmentId: enrollment.id,
      })),
    };
  }
}
