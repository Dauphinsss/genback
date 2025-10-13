// src/units/units.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';

@Injectable()
export class UnitsService {
  constructor(private readonly prismaService: PrismaService) {}

  // Crear unidad
  async create(createUnitDto: CreateUnitDto) {
    return this.prismaService.unit.create({
      data: createUnitDto,
    });
  }

  // Listar todas las unidades
  async findAll() {
    return this.prismaService.unit.findMany();
  }

  // Obtener una unidad por ID
  async findOne(id: number) {
    const unit = await this.prismaService.unit.findUnique({
      where: { id },
    });
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }
    return unit;
  }

  // Eliminar una unidad por ID y lecciones
  async remove(id: number) {
    await this.findOne(id);

    return this.prismaService.$transaction(async (tx) => {
      await tx.lesson.deleteMany({ where: { unitId: id } });
      return tx.unit.delete({ where: { id } });
    });
  }
}
