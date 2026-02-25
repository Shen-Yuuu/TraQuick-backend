import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OSS from 'ali-oss';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private client: OSS;

  constructor(private readonly configService: ConfigService) {
    this.client = new OSS({
      region: this.configService.get<string>('OSS_REGION'),
      accessKeyId: this.configService.get<string>('OSS_ACCESS_KEY_ID', ''),
      accessKeySecret: this.configService.get<string>('OSS_ACCESS_KEY_SECRET', ''),
      bucket: this.configService.get<string>('OSS_BUCKET'),
    });
  }

  /**
   * 上传单个文件到 OSS
   */
  async uploadFile(file: Express.Multer.File): Promise<{ url: string; key: string }> {
    // 校验文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('不支持的文件类型，仅支持 jpg/png/gif/webp/mp4');
    }

    // 校验文件大小（图片 10MB，视频 50MB）
    const maxSize = file.mimetype.startsWith('video') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(
        file.mimetype.startsWith('video') ? '视频不超过50MB' : '图片不超过10MB',
      );
    }

    // 生成 OSS 路径：traquick/images/2026/02/uuid.jpg
    const ext = file.originalname.split('.').pop() || 'jpg';
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const folder = file.mimetype.startsWith('video') ? 'videos' : 'images';
    const key = `traquick/${folder}/${year}/${month}/${uuidv4()}.${ext}`;

    try {
      const result = await this.client.put(key, file.buffer);
      return {
        url: result.url,
        key,
      };
    } catch (error) {
      throw new BadRequestException('文件上传失败，请重试');
    }
  }

  /**
   * 批量上传
   */
  async uploadFiles(files: Express.Multer.File[]): Promise<{ urls: string[]; keys: string[] }> {
    const results = await Promise.all(files.map((file) => this.uploadFile(file)));
    return {
      urls: results.map((r) => r.url),
      keys: results.map((r) => r.key),
    };
  }

  /**
   * 删除文件
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.client.delete(key);
    } catch (error) {
      // 删除失败不影响业务
      console.error(`[Upload] 删除文件失败: ${key}`, error);
    }
  }
}