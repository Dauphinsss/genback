import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IFileUploadService } from './interfaces/file-upload.interface';

@Injectable()
export class UploadService {
  constructor(
    private prisma: PrismaService,
    @Inject('FILE_UPLOAD_SERVICE') private fileUploadService: IFileUploadService,
  ) {}

  async uploadUserAvatar(file: any, userId: number): Promise<{ avatarUrl: string; user: any }> {
    // Obtener usuario actual para eliminar avatar anterior
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new Error('Usuario no encontrado');
    }

    // Eliminar avatar anterior si existe y no es de un servicio externo
    if (currentUser.avatar && this.isLocalFile(currentUser.avatar)) {
      await this.fileUploadService.deleteFile(currentUser.avatar);
    }

    // Subir nuevo archivo
    const avatarUrl = await this.fileUploadService.uploadFile(file, userId);

    // Actualizar usuario en la base de datos
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        createdAt: true,
      },
    });

    return {
      avatarUrl,
      user: updatedUser,
    };
  }

  private isLocalFile(url: string): boolean {
    // Verificar si es un archivo local (no de servicios externos como Google, ui-avatars, Cloudinary, etc.)
    return url.includes('/uploads/') || 
           url.startsWith('http://localhost') || 
           url.startsWith('http://127.0.0.1');
  }
}