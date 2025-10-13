import { Unit } from '@prisma/client';

export type CreateUnitDto = Pick<Unit, 'title' | 'index' | 'published'>;
