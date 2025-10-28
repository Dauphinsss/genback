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
      storage: undefined,
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (req, file, callback) => {
        // Por ahora, bloqueamos imágenes como recursos independientes
        if (file.mimetype.startsWith('image/')) {
          callback(new Error('No se permite subir imágenes por ahora'), false);
          return;
        }

        const allowed = [
          'video/mp4',
          'video/webm',
          'video/avi',
          'audio/mp3',
          'audio/wav',
          'audio/ogg',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (allowed.includes(file.mimetype)) callback(null, true);
        else callback(new Error('Tipo de archivo no permitido'), false);
      },
    }),
  ],
  controllers: [ContentController],
  providers: [ContentService, ResourceService, GCSContentService],
  exports: [ContentService, ResourceService],
})
export class ContentModule {}
