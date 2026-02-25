import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BottleService } from './bottle.service';
import { CreateBottleDto } from './dto/create-bottle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/bottles')
export class BottleController {
  constructor(private readonly bottleService: BottleService) {}

  /**
   * POST /api/bottles - 投放漂流瓶
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createBottleDto: CreateBottleDto, @Request() req: any) {
    const userId = req.user.sub;
    return await this.bottleService.create(userId, createBottleDto);
  }

  /**
   * POST /api/bottles/pick - 随机捡一个漂流瓶
   */
  @UseGuards(JwtAuthGuard)
  @Post('pick')
  async pick(@Request() req: any) {
    const userId = req.user.sub;
    return await this.bottleService.pickRandom(userId);
  }

  /**
   * GET /api/bottles/sent - 我投放的瓶子
   */
  @UseGuards(JwtAuthGuard)
  @Get('sent')
  async getMySent(@Request() req: any) {
    const userId = req.user.sub;
    return await this.bottleService.getMySentBottles(userId);
  }

  /**
   * GET /api/bottles/picked - 我捡到的瓶子
   */
  @UseGuards(JwtAuthGuard)
  @Get('picked')
  async getMyPicked(@Request() req: any) {
    const userId = req.user.sub;
    return await this.bottleService.getMyPickedBottles(userId);
  }
}