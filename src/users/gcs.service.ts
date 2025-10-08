import { Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class GCSService {
  private storage = new Storage({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    projectId: 'generacion-472902',
  });
  private bucketName = process.env.GCP_BUCKET_NAME;

  async uploadFile(file: Express.Multer.File, userId: number | string) {
    const ext = path.extname(file.originalname);
    const gcsFileName = `avatars/avatar_${userId}_${uuidv4()}${ext}`;
    const bucket = this.storage.bucket(this.bucketName);

    const blob = bucket.file(gcsFileName);

    await blob.save(file.buffer, {
      contentType: file.mimetype,
      validation: 'md5',
    });

    return `https://storage.googleapis.com/${this.bucketName}/${gcsFileName}`;
  }
}
