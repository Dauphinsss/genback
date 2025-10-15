import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { CourseBService } from './course-b.service';

@Controller('courses')
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

  // GET /courses  (lista todos o filtra con ?status=activo|inactivo)
  @Get()
  async findAll(@Query('status') status?: 'activo' | 'inactivo') {
    if (status) return this.coursesService.getByStatus(status);
    return this.coursesService.getAllCourses();
  }

  // GET /courses/active
  @Get('active')
  async active() {
    return this.coursesService.getActiveCourses();
  }

  // (opcional) GET /courses/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.getById(id);
  }
}
