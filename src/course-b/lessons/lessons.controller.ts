// src/course-b/lessons/lessons.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Patch,
  Delete,
  Body,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  // GET /lessons?unitId=1
  @Get()
  async getAll(@Query('unitId') unitId?: string) {
    if (!unitId) {
      throw new BadRequestException('Falta el parámetro unitId');
    }
    const parsed = Number(unitId);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException('unitId debe ser un número');
    }
    return this.lessonsService.getAllLessons(parsed);
  }

  // GET /lessons/5
  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.lessonsService.getLessonById(id);
  }

  // POST /lessons
  @Post()
  async create(
    @Body()
    body: {
      title: string;
      index: number;
      unitId: number;
    },
  ) {
    if (!body?.title || body.index === undefined || body.unitId === undefined) {
      throw new BadRequestException('title, index y unitId son requeridos');
    }
    return this.lessonsService.createLesson({
      title: String(body.title),
      index: Number(body.index),
      unitId: Number(body.unitId),
    });
  }

  // PATCH /lessons/id
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { title?: string; index?: number },
  ) {
    const payload: { title?: string; index?: number } = {};
    if (body.title !== undefined) payload.title = String(body.title);
    if (body.index !== undefined) payload.index = Number(body.index);
    if (Object.keys(payload).length === 0) {
      throw new BadRequestException(
        'Debes enviar al menos un campo a actualizar',
      );
    }
    return this.lessonsService.updateLesson(id, payload);
  }

  // DELETE /lessons/5
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.lessonsService.deleteLesson(id);
  }
}
