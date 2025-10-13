// src/lessons/lessons.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  // Crear lección
  @Post()
  create(@Body() createLessonDto: CreateLessonDto) {
    return this.lessonsService.create(createLessonDto);
  }

  // Obtener todas las lecciones
  @Get()
  async findAll() {
    const lessons = await this.lessonsService.findAll();
    console.log(lessons);
    return lessons;
  }

  // Eliminar lecciones
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.lessonsService.remove(id);
  }
}
