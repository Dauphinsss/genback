import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // POST /courses/join - Unirse a curso
  @Post('join')
  async joinCourse(@Request() req, @Body('courseCode') courseCode: string) {
    return this.coursesService.joinCourse(req.user.id, courseCode);
  }

  // GET /courses/my - Obtener mis cursos
  @Get('my')
  async getMyCourses(@Request() req) {
    return this.coursesService.getUserCourses(req.user.id);
  }
}
