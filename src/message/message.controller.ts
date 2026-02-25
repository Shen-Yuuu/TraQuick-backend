import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { QueryMessageDto } from './dto/query-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  /**
   * GET /api/messages - 获取我的消息列表
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyMessages(@Request() req: any, @Query() queryDto: QueryMessageDto) {
    const userId = req.user.sub;
    return await this.messageService.getMyMessages(userId, queryDto);
  }

  /**
   * GET /api/messages/groups - 获取消息分组概览
   */
  @UseGuards(JwtAuthGuard)
  @Get('groups')
  async getGroups(@Request() req: any) {
    const userId = req.user.sub;
    return await this.messageService.getMessageGroups(userId);
  }

  /**
   * PUT /api/messages/:id/read - 标记单条消息已读
   */
  @UseGuards(JwtAuthGuard)
  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    await this.messageService.markAsRead(id, userId);
    return { message: '已标记为已读' };
  }

  /**
   * PUT /api/messages/read-all - 全部标记已读
   */
  @UseGuards(JwtAuthGuard)
  @Put('read-all')
  async markAllAsRead(
    @Request() req: any,
    @Query('type') type?: string,
  ) {
    const userId = req.user.sub;
    return await this.messageService.markAllAsRead(userId, type);
  }
}