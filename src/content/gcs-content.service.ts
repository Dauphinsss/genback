import { Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class GCSContentService {
  private storage = new Storage({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    projectId: 'generacion-472902',
  });
  private bucketName = process.env.GCP_BUCKET_NAME;

  /**
   * Subir un archivo al Google Cloud Storage
   * @param file - Archivo de Multer
   * @param contentId - ID del contenido asociado
   * @returns URL pública del archivo
   */
  async uploadFile(
    file: Express.Multer.File,
    contentId: number,
  ): Promise<string> {
    const ext = path.extname(file.originalname);
    const sanitizedName = this.sanitizeFilename(
      path.basename(file.originalname, ext),
    );
    const gcsFileName = `content/${contentId}/${sanitizedName}_${uuidv4()}${ext}`;

    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(gcsFileName);

    await blob.save(file.buffer, {
      contentType: file.mimetype,
      validation: 'md5',
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Hacer el archivo público
    await blob.makePublic();

    return `https://storage.googleapis.com/${this.bucketName}/${gcsFileName}`;
  }

  /**
   * Eliminar un archivo del Google Cloud Storage
   * @param fileUrl - URL del archivo a eliminar
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extraer el nombre del archivo de la URL
      const fileName = this.extractFileNameFromUrl(fileUrl);
      if (!fileName) {
        throw new Error('Invalid file URL');
      }

      const bucket = this.storage.bucket(this.bucketName);
      await bucket.file(fileName).delete();
    } catch (error) {
      console.error('Error deleting file from GCS:', error);
      // No lanzar error para no bloquear la eliminación del registro en BD
    }
  }

  /**
   * Extraer el nombre del archivo de una URL de GCS
   */
  private extractFileNameFromUrl(url: string): string | null {
    const match = url.match(/storage\.googleapis\.com\/[^/]+\/(.+)/);
    return match ? match[1] : null;
  }

  /**
   * Sanitizar nombre de archivo para evitar problemas
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-zA-Z0-9-_]/g, '_') // Reemplazar caracteres especiales
      .substring(0, 50); // Limitar longitud
  }

  /**
   * Verificar si un archivo existe en GCS
   */
  async fileExists(fileUrl: string): Promise<boolean> {
    try {
      const fileName = this.extractFileNameFromUrl(fileUrl);
      if (!fileName) return false;

      const bucket = this.storage.bucket(this.bucketName);
      const [exists] = await bucket.file(fileName).exists();
      return exists;
    } catch {
      return false;
    }
  }
}
