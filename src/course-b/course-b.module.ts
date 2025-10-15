import { Module } from '@nestjs/common';
import { CourseBController } from './course-b.controller';
import { CourseBService } from './course-b.service';

@Module({
  controllers: [CourseBController],
  providers: [CourseBService],
})
export class CourseBModule {}
