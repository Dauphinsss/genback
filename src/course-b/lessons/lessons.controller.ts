// src/course-b/lessons/lessons.controller.ts
import {
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Body,
  ParseIntPipe,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('lessons')
@UseGuards(JwtAuthGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get('/units/:unitId/lessons')
  async getLessonsByUnit(@Param('unitId', ParseIntPipe) unitId: number) {
    return this.lessonsService.getAllLessons(unitId);
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

  // Asociar un topic a una lección
  @Post(':lessonId/topics/:topicId')
  async associateTopic(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() body?: { order?: number },
  ) {
    return this.lessonsService.associateTopicToLesson(
      lessonId,
      topicId,
      body?.order,
    );
  }

  // Desasociar un topic de una lección
  @Delete(':lessonId/topics/:topicId')
  async dissociateTopic(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
  ) {
    return this.lessonsService.dissociateTopicFromLesson(lessonId, topicId);
  }

  // Obtener todos los topics de una lección
  @Get(':lessonId/topics')
  async getTopicsByLesson(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.lessonsService.getTopicsByLesson(lessonId);
  }

  // Actualizar el orden de un topic en una lección
  @Patch(':lessonId/topics/:topicId/order')
  async updateTopicOrder(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() body: { order: number },
  ) {
    if (body.order === undefined) {
      throw new BadRequestException('El campo order es requerido');
    }
    return this.lessonsService.updateTopicOrder(lessonId, topicId, body.order);
  }
}
