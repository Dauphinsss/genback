import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  ParseIntPipe,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { CourseBService } from './course-b.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CourseBController {
  constructor(private readonly coursesService: CourseBService) {}

  // POST /courses
  @Post()
  async create(
    @Body()
    body: {
      title: string;
      status?: 'activo' | 'inactivo';
    },
  ) {
    return this.coursesService.createCourse(body.title, body.status);
  }

  // GET /courses  lista todos o filtra con ?status=activo|inactivo
  @Get()
  async findAll(@Query('status') status?: 'activo' | 'inactivo') {
    if (status) return this.coursesService.getByStatus(status);
    return this.coursesService.getAllCourses();
  }

  // GET /courses/active/full -> Curso activo con contenido completo
  @Get('active/full')
  async getActiveCourseWithContent() {
    return this.coursesService.getActiveCourseWithContent();
  }

  // GET /courses/active
  @Get('active')
  async active() {
    return this.coursesService.getActiveCourses();
  }

  // GET /courses/editable -> Obtiene el curso que se puede editar
  @Get('editable')
  async getEditableCourse() {
    return this.coursesService.getEditableCourse();
  }

  // POST /courses/:id/clone -> Crea una copia del curso
  @Post(':id/clone')
  async cloneCourse(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.cloneCourse(id);
  }

  // PATCH /courses/:id/activate -> Activa un curso
  @Patch(':id/activate')
  async activateCourse(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.activateCourse(id);
  }

  // PATCH /courses/:id -> Actualiza el curso
  @Patch(':id')
  async updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { title?: string },
  ) {
    return this.coursesService.updateCourse(id, body);
  }

  // GET /courses/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.getById(id);
  }
}
