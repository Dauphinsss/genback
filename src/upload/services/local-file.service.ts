import { Injectable } from '@nestjs/common';
import { IFileUploadService } from '../interfaces/file-upload.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalFileService implements IFileUploadService {
  private readonly uploadPath = path.join(process.cwd(), 'uploads', 'avatars');

  constructor() {
    this.ensureUploadDirectoryExists();
  }

  async uploadFile(file: any, userId: number): Promise<string> {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Tipo de archivo no permitido. Solo se permiten: JPG, PNG, WebP, GIF');
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('El archivo es demasiado grande. Máximo 5MB');
    }
    const fileExtension = path.extname(file.originalname);
    const fileName = `avatar_${userId}_${Date.now()}${fileExtension}`;
    const filePath = path.join(this.uploadPath, fileName);

    await this.deleteOldAvatar(userId);

    await fs.promises.writeFile(filePath, file.buffer);

    return `${process.env.BACKEND_URL || 'http://localhost:4000'}/uploads/avatars/${fileName}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const fileName = path.basename(fileUrl);
      const filePath = path.join(this.uploadPath, fileName);

      if (await this.fileExists(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.warn('Error al eliminar archivo:', error);
    }
  }

  private async deleteOldAvatar(userId: number): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.uploadPath);
      const userAvatarFiles = files.filter(file => 
        file.startsWith(`avatar_${userId}_`) && 
        !file.includes(`_${Date.now()}`)
      );

      for (const file of userAvatarFiles) {
        const filePath = path.join(this.uploadPath, file);
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.warn('Error al eliminar avatar anterior:', error);
    }
  }

  private ensureUploadDirectoryExists(): void {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}