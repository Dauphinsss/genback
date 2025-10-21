import { Module } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { TopicsController } from './topics.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GCSContentService } from '../content/gcs-content.service';

@Module({
  imports: [PrismaModule],
  controllers: [TopicsController],
  providers: [TopicsService, GCSContentService],
  exports: [TopicsService],
})
export class TopicsModule {}
