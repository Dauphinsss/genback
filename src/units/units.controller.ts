// src/units/units.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Delete,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';

@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  // Crear una nueva unidad
  @Post()
  create(@Body() createUnitDto: CreateUnitDto) {
    return this.unitsService.create(createUnitDto);
  }

  // Obtener todas las unidades
  @Get()
  async findAll() {
    return this.unitsService.findAll();
  }

  // Obtener una unidad por ID
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const unit = await this.unitsService.findOne(id);
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  // Eliminar una unidad por ID
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.unitsService.remove(id);
  }
}
