import { Module } from '@nestjs/common';
import { UnitsController } from './units.controller';
import { UnitsService } from './units.service';
import { LessonsModule } from 'src/lessons/lessons.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [LessonsModule],
  controllers: [UnitsController],
  providers: [UnitsService, PrismaService],
  exports: [UnitsService],
})
export class UnitsModule {}
