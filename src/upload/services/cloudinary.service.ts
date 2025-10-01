import { Injectable } from '@nestjs/common';
import { IFileUploadService } from '../interfaces/file-upload.interface';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService implements IFileUploadService {
  constructor() {
    // Configuración de Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFile(file: any, userId: number): Promise<string> {
    // Validar tipo de archivo
    const allowedMimeTypes = [
      'image/jpeg', 
      'image/png', 
      'image/webp', 
      'image/gif',
      'video/mp4',
      'video/webm',
      'audio/mp3',
      'audio/wav'
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Tipo de archivo no permitido');
    }

    // Validar tamaño (10MB máximo)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('El archivo es demasiado grande. Máximo 10MB');
    }

    try {
      // Determinar el tipo de recurso
      const resourceType = this.getResourceType(file.mimetype);
      
      // Generar public_id único
      const publicId = `user_${userId}/avatar_${Date.now()}`;

      // Subir a Cloudinary
      const uploadResult = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        {
          public_id: publicId,
          resource_type: resourceType,
          folder: 'genback/avatars',
          transformation: resourceType === 'image' ? [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' }
          ] : undefined,
          overwrite: true, // Sobrescribir si ya existe
        }
      );

      // Retornar URL optimizada
      return uploadResult.secure_url;
    } catch (error) {
      console.error('Error subiendo a Cloudinary:', error);
      throw new Error('Error al subir el archivo a Cloudinary');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extraer public_id de la URL de Cloudinary
      const publicId = this.extractPublicIdFromUrl(fileUrl);
      
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (error) {
      console.warn('Error al eliminar archivo de Cloudinary:', error);
    }
  }

  private getResourceType(mimetype: string): 'image' | 'video' | 'raw' {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    return 'raw'; // Para audios y otros archivos
  }

  private extractPublicIdFromUrl(url: string): string | null {
    try {
      // Extraer public_id de URL de Cloudinary
      const match = url.match(/\/(?:v\d+\/)?(.+?)\.(jpg|jpeg|png|gif|webp|mp4|webm|mp3|wav)$/i);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
}