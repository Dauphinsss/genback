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
    const sanitized = this.sanitizeFilename(
      path.basename(file.originalname, ext),
    );
    const gcsFileName = `content/${contentId}/${sanitized}_${uuidv4()}${ext}`;

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
      if (!fileName) throw new Error('Invalid file URL');
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
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 50);
  }

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
   * Subir archivo JSON (blocksJson) al bucket
   */
  async uploadJsonFile(blocksJson: any, topicId: number): Promise<string> {
    const gcsFileName = `topics/${topicId}/content.json`;
    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(gcsFileName);

    await blob.save(JSON.stringify(blocksJson, null, 2), {
      contentType: 'application/json',
      metadata: { cacheControl: 'no-cache' },
    });

    return `https://storage.googleapis.com/${this.bucketName}/${gcsFileName}`;
  }

  /**
   * Descargar el JSON del bucket
   */
  async downloadJsonFile(fileUrl: string): Promise<any> {
    try {
      const fileName = this.extractFileNameFromUrl(fileUrl);
      if (!fileName) throw new Error('Invalid file URL');

      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);
      const [contents] = await file.download();
      return JSON.parse(contents.toString('utf-8'));
    } catch (error) {
      console.error('Error descargando JSON desde GCS:', error);
      throw error;
    }
  }
}
