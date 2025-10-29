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
      status?: 'activo' | 'inactivo' | 'historico';
    },
  ) {
    return this.coursesService.createCourse(body.title, body.status);
  }

  // GET /courses  lista todos o filtra con ?status=activo|inactivo
  @Get()
  async findAll(@Query('status') status?: 'activo' | 'inactivo' | 'historico') {
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

  // GET /courses/inactive -> Obtiene el curso inactivo
  @Get('inactive')
  async getInactiveCourse() {
    return this.coursesService.getInactiveCourse();
  }

  // GET /courses/historic -> Obtiene los cursos históricos
  @Get('historic')
  async getHistoricCourses() {
    return this.coursesService.getHistoricCourses();
  }

  // POST /courses/clone -> Clona el curso activo a inactivo
  @Post('clone')
  async cloneActiveToInactive() {
    return this.coursesService.cloneActiveToInactive();
  }

  // PATCH /courses/activate -> Activa el curso inactivo
  @Patch('activate')
  async activateInactiveCourse() {
    return this.coursesService.activateInactiveCourse();
  }

  // PATCH /courses/:id -> Actualiza el curso
  @Patch(':id')
  async updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { title?: string },
  ) {
    return this.coursesService.updateCourse(id, body);
  }

  // GET /courses/:id/full
  @Get(':id/full')
  async getCourseWithContent(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.getCourseWithContent(id);
  }

  // GET /courses/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.getById(id);
  }
}
