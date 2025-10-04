export interface IFileUploadService {
  uploadFile(file: any, userId: number): Promise<string>;
  deleteFile(filePath: string): Promise<void>;
}