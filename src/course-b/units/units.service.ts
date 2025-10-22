// units.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async createUnit(data: {
    title: string;
    courseBaseId: number;
    index: number;
  }) {
    const course = await this.prisma.courseBase.findUnique({
      where: { id: data.courseBaseId },
    });

    if (!course) throw new Error('Curso no encontrado');

    // REGLA: Solo se pueden editar cursos INACTIVOS
    if (course.status === 'activo') {
      throw new Error(
        'No se puede editar un curso activo. Los cursos activos están en uso por profesores y estudiantes.',
      );
    }

    return this.prisma.unit.create({
      data: {
        title: data.title,
        index: data.index,
        courseBase: { connect: { id: data.courseBaseId } },
      },
    });
  }

  async getAllUnits() {
    return this.prisma.unit.findMany({
      orderBy: [{ courseBaseId: 'asc' }, { index: 'asc' }],
    });
  }

  async getUnitById(unitId: number) {
    return this.prisma.unit.findUnique({
      where: { id: unitId },
    });
  }

  async getUnitsByCourse(courseBaseId: number) {
    return this.prisma.unit.findMany({
      where: { courseBaseId },
      orderBy: { index: 'asc' },
    });
  }

  async updateUnit(unitId: number, title: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: { courseBase: true },
    });

    if (!unit) throw new Error('Unidad no encontrada');

    // REGLA: Solo se pueden editar cursos INACTIVOS
    if (unit.courseBase.status === 'activo') {
      throw new Error(
        'No se puede editar un curso activo. Los cursos activos están en uso por profesores y estudiantes.',
      );
    }

    return this.prisma.unit.update({
      where: { id: unitId },
      data: { title },
    });
  }

  async deleteUnit(unitId: number) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: { courseBase: true },
    });

    if (!unit) throw new Error('Unidad no encontrada');

    // REGLA: Solo se pueden editar cursos INACTIVOS
    if (unit.courseBase.status === 'activo') {
      throw new Error(
        'No se puede eliminar unidades de un curso activo. Los cursos activos están en uso por profesores y estudiantes.',
      );
    }

    await this.prisma.lesson.deleteMany({
      where: { unitId },
    });

    return this.prisma.unit.delete({
      where: { id: unitId },
    });
  }
}
