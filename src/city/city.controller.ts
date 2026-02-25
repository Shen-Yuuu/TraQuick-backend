import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CityService } from './city.service';
import { QueryCityDto } from './dto/query-city.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('api/cities')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  /**
   * GET /api/cities - 获取城市列表
   */
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async findAll(@Query() queryDto: QueryCityDto, @Request() req: any) {
    const currentUserId = req.user?.sub || null;
    return await this.cityService.findAll(queryDto, currentUserId);
  }

  /**
   * GET /api/cities/markers - 获取地图标记点
   */
  @UseGuards(OptionalJwtAuthGuard)
  @Get('markers')
  async getMarkers(@Request() req: any) {
    const currentUserId = req.user?.sub || null;
    return await this.cityService.getMarkers(currentUserId);
  }

  /**
   * GET /api/cities/my - 获取我点亮的城市
   */
  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyCities(@Request() req: any) {
    const userId = req.user.sub;
    return await this.cityService.getUserCities(userId);
  }

  /**
   * GET /api/cities/:id - 获取城市详情
   */
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const currentUserId = req.user?.sub || null;
    return await this.cityService.findOne(id, currentUserId);
  }

  /**
   * POST /api/cities/:id/check-in - 签到打卡（点亮城市）
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/check-in')
  async checkIn(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return await this.cityService.checkIn(id, userId);
  }
}