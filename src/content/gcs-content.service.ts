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
    });

    return `https://storage.googleapis.com/${this.bucketName}/${gcsFileName}`;
  }
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const fileName = this.extractFileNameFromUrl(fileUrl);
      if (!fileName) {
        throw new Error('Invalid file URL');
      }

      const bucket = this.storage.bucket(this.bucketName);
      await bucket.file(fileName).delete();
    } catch (error) {
      console.error('Error deleting file from GCS:', error);
    }
  }

  private extractFileNameFromUrl(url: string): string | null {
    const match = url.match(/storage\.googleapis\.com\/[^/]+\/(.+)/);
    return match ? match[1] : null;
  }
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

  /**
   * Subir archivo HTML al GCS
   */
  async uploadHtmlFile(
    htmlContent: string,
    topicId: number,
  ): Promise<string> {
    const gcsFileName = `topics/${topicId}/content.html`;
    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(gcsFileName);

    await blob.save(htmlContent, {
      contentType: 'text/html',
      metadata: {
        cacheControl: 'no-cache',
      },
    });

    return `https://storage.googleapis.com/${this.bucketName}/${gcsFileName}`;
  }

  /**
   * Obtener contenido HTML desde GCS
   */
  async downloadHtmlFile(fileUrl: string): Promise<string> {
    try {
      const fileName = this.extractFileNameFromUrl(fileUrl);
      if (!fileName) {
        throw new Error('Invalid file URL');
      }

      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);
      const [contents] = await file.download();
      
      return contents.toString('utf-8');
    } catch (error) {
      console.error('Error downloading HTML from GCS:', error);
      throw error;
    }
  }
}
