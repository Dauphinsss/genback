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
}
