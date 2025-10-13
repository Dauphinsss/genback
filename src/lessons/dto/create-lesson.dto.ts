// src/units/dto/create-unit.dto.ts
import { Lesson } from '@prisma/client';

export type CreateLessonDto = Pick<Lesson, 'title' | 'index' | 'published'> & {
  unitId: number;
};
