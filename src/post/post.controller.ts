import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('api/posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  /**
   * POST /api/posts - 发布动态
   * 需要 Token
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createPostDto: CreatePostDto, @Request() req: any) {
    const userId = req.user.sub;
    return await this.postService.create(userId, createPostDto);
  }

  /**
   * GET /api/posts - 获取动态列表
   * Token 可选：有 Token 返回 isLiked/isCollected，无 Token 返回 false
   */
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async findAll(@Query() queryDto: QueryPostDto, @Request() req: any) {
    const currentUserId = req.user?.sub || null;
    return await this.postService.findAll(queryDto, currentUserId);
  }

  /**
   * GET /api/posts/:id - 获取动态详情
   * Token 可选
   */
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const currentUserId = req.user?.sub || null;
    return await this.postService.findOne(id, currentUserId);
  }

  /**
   * DELETE /api/posts/:id - 删除动态（软删除）
   * 需要 Token，只能删自己的
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    await this.postService.remove(id, userId);
    return { message: '删除成功' };
  }

  /**
   * POST /api/posts/:id/like - 点赞
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async like(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return await this.postService.like(id, userId);
  }

  /**
   * DELETE /api/posts/:id/like - 取消点赞
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id/like')
  async unlike(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return await this.postService.unlike(id, userId);
  }

  /**
   * POST /api/posts/:id/collect - 收藏
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/collect')
  async collect(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return await this.postService.collect(id, userId);
  }

  /**
   * DELETE /api/posts/:id/collect - 取消收藏
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id/collect')
  async uncollect(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return await this.postService.uncollect(id, userId);
  }
}