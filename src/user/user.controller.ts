import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { MessageService } from '../message/message.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('api/users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly messageService: MessageService,
  ) {}

  /**
   * GET /api/users/me - 获取当前登录用户信息
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: any) {
    const userId = req.user.sub;
    return await this.userService.findByIdOrFail(userId);
  }

  /**
   * PUT /api/users/me - 更新当前用户资料
   */
  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateMe(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.sub;
    return await this.userService.update(userId, updateUserDto);
  }

  /**
   * GET /api/users/:id - 获取用户主页（含关系）
   */
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async getUser(@Param('id') id: string, @Request() req: any) {
    const currentUserId = req.user?.sub || null;
    return await this.userService.getUserProfile(id, currentUserId);
  }

  /**
   * POST /api/users/:id/follow - 关注
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  async follow(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    const result = await this.userService.follow(userId, id);

    // 发送关注通知给对方
    const follower = await this.userService.findByIdOrFail(userId);
    await this.messageService.create({
      userId: id,
      type: 'follow',
      title: '新粉丝',
      content: `${follower.nickname} 关注了你`,
      relatedUserId: userId,
    });

    return result;
  }

  /**
   * DELETE /api/users/:id/follow - 取消关注（不发通知）
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id/follow')
  async unfollow(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return await this.userService.unfollow(userId, id);
  }

  /**
   * GET /api/users/:id/following - 关注列表
   */
  @Get(':id/following')
  async getFollowing(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return await this.userService.getFollowingList(id, parseInt(page, 10), parseInt(limit, 10));
  }

  /**
   * GET /api/users/:id/followers - 粉丝列表
   */
  @Get(':id/followers')
  async getFollowers(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return await this.userService.getFollowersList(id, parseInt(page, 10), parseInt(limit, 10));
  }
}