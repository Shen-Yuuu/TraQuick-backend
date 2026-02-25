import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * POST /api/upload/image - 上传单张图片
   */
  @UseGuards(JwtAuthGuard)
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }
    return await this.uploadService.uploadFile(file);
  }

  /**
   * POST /api/upload/images - 批量上传图片（最多9张）
   */
  @UseGuards(JwtAuthGuard)
  @Post('images')
  @UseInterceptors(
    FilesInterceptor('files', 9, {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('请选择要上传的文件');
    }
    return await this.uploadService.uploadFiles(files);
  }

  /**
   * POST /api/upload/video - 上传视频
   */
  @UseGuards(JwtAuthGuard)
  @Post('video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的视频');
    }
    return await this.uploadService.uploadFile(file);
  }
}