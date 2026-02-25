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
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  /**
   * POST /api/comments - 发表评论
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createCommentDto: CreateCommentDto, @Request() req: any) {
    const userId = req.user.sub;
    return await this.commentService.create(userId, createCommentDto);
  }

  /**
   * GET /api/comments/post/:postId - 获取帖子的评论列表
   */
  @Get('post/:postId')
  async findByPost(
    @Param('postId') postId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return await this.commentService.findByPostId(
      postId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  /**
   * DELETE /api/comments/:id - 删除评论
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    await this.commentService.remove(id, userId);
    return { message: '删除成功' };
  }
}