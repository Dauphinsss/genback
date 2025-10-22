// units.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UnitsService } from './units.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  // POST /units
  @Post('units')
  create(
    @Body()
    body: {
      title: string;
      courseBaseId: number;
      index: number;
    },
  ) {
    return this.unitsService.createUnit(body);
  }

  // GET /units
  @Get('units')
  findAll() {
    return this.unitsService.getAllUnits();
  }

  // GET /units/:id
  @Get('units/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.unitsService.getUnitById(id);
  }

  // GET /courses/:courseId/units
  @Get('courses/:courseId/units')
  findByCourse(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.unitsService.getUnitsByCourse(courseId);
  }

  // PATCH /units/:id
  @Patch('units/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { title: string },
  ) {
    return this.unitsService.updateUnit(id, body.title);
  }

  // DELETE /units/:id
  @Delete('units/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.unitsService.deleteUnit(id);
  }
}
