import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { LocalFileService } from './services/local-file.service';
import { CloudinaryService } from './services/cloudinary.service';

@Module({
  imports: [
    MulterModule.register({
      // Configuración para usar memoria (buffer) en lugar de disco
      storage: undefined, // Usaremos memoria por defecto
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error('Tipo de archivo no permitido'), false);
        }
      },
    }),
  ],
  controllers: [UploadController],
  providers: [
    UploadService,
    LocalFileService,
    CloudinaryService,
    {
      provide: 'FILE_UPLOAD_SERVICE',
      useClass: CloudinaryService, // ✨ CAMBIADO: Ahora usa Cloudinary
    },
  ],
  exports: [UploadService, 'FILE_UPLOAD_SERVICE'],
})
export class UploadModule {}