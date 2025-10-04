import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(@UploadedFile() file: any, @Req() req: any) {
    try {
      if (!file) {
        throw new HttpException('No se ha proporcionado ningún archivo', HttpStatus.BAD_REQUEST);
      }

      const userId = req.user.id;
      const result = await this.uploadService.uploadUserAvatar(file, userId);

      return {
        success: true,
        message: 'Avatar actualizado correctamente',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al subir el avatar',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}