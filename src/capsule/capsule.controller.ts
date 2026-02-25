import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CapsuleService } from './capsule.service';
import { CreateCapsuleDto } from './dto/create-capsule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/capsules')
export class CapsuleController {
  constructor(private readonly capsuleService: CapsuleService) {}

  /**
   * POST /api/capsules - 创建时空胶囊
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createCapsuleDto: CreateCapsuleDto, @Request() req: any) {
    const userId = req.user.sub;
    return await this.capsuleService.create(userId, createCapsuleDto);
  }

  /**
   * GET /api/capsules - 获取我的胶囊列表
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyCapsules(@Request() req: any) {
    const userId = req.user.sub;
    return await this.capsuleService.getMyCapsules(userId);
  }

  /**
   * GET /api/capsules/:id - 获取胶囊详情
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return await this.capsuleService.findOne(id, userId);
  }

  /**
   * DELETE /api/capsules/:id - 删除胶囊
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    await this.capsuleService.remove(id, userId);
    return { message: '删除成功' };
  }
}