import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { ResourceService } from './resource.service';
import { GCSContentService } from './gcs-content.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: undefined, // Usar memoria
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB para videos
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          // Imágenes
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          // Videos
          'video/mp4',
          'video/webm',
          'video/avi',
          // Audios
          'audio/mp3',
          'audio/wav',
          'audio/ogg',
          // Documentos
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error('Tipo de archivo no permitido'), false);
        }
      },
    }),
  ],
  controllers: [ContentController],
  providers: [ContentService, ResourceService, GCSContentService],
  exports: [ContentService, ResourceService],
})
export class ContentModule {}
