import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './entities/city.entity';
import { UserCity } from './entities/user-city.entity';
import { UserService } from '../user/user.service';
import { QueryCityDto } from './dto/query-city.dto';

export interface CityListItem {
  id: string;
  name: string;
  nameEn: string | null;
  country: string;
  countryCode: string;
  province: string | null;
  coverImage: string;
  latitude: number;
  longitude: number;
  description: string | null;
  postsCount: number;
  visitorsCount: number;
  isUnlocked: boolean;
}

@Injectable()
export class CityService {
  constructor(
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,

    @InjectRepository(UserCity)
    private readonly userCityRepository: Repository<UserCity>,

    private readonly userService: UserService,
  ) {}

  /**
   * 获取城市列表
   */
  async findAll(
    queryDto: QueryCityDto,
    currentUserId?: string,
  ): Promise<CityListItem[]> {
    const qb = this.cityRepository.createQueryBuilder('city');

    // 按国家筛选
    if (queryDto.country) {
      qb.andWhere('city.country = :country', { country: queryDto.country });
    }

    // 按关键词搜索
    if (queryDto.keyword) {
      qb.andWhere(
        '(city.name ILIKE :kw OR city.name_en ILIKE :kw OR city.country ILIKE :kw)',
        { kw: `%${queryDto.keyword}%` },
      );
    }

    qb.orderBy('city.visitorsCount', 'DESC');

    const cities = await qb.getMany();

    // 查询当前用户已点亮的城市
    let unlockedCityIds: Set<string> = new Set();
    if (currentUserId) {
      const userCities = await this.userCityRepository.find({
        where: { user: { id: currentUserId } },
        relations: ['city'],
      });
      unlockedCityIds = new Set(userCities.map((uc) => uc.city.id));
    }

    return cities.map((city) => ({
      id: city.id,
      name: city.name,
      nameEn: city.nameEn,
      country: city.country,
      countryCode: city.countryCode,
      province: city.province,
      coverImage: city.coverImage,
      latitude: Number(city.latitude),
      longitude: Number(city.longitude),
      description: city.description,
      postsCount: city.postsCount,
      visitorsCount: city.visitorsCount,
      isUnlocked: unlockedCityIds.has(city.id),
    }));
  }

  /**
   * 获取城市详情
   */
  async findOne(cityId: string, currentUserId?: string): Promise<CityListItem> {
    const city = await this.cityRepository.findOne({
      where: { id: cityId },
    });

    if (!city) {
      throw new NotFoundException('城市不存在');
    }

    let isUnlocked = false;
    if (currentUserId) {
      const userCity = await this.userCityRepository.findOne({
        where: {
          user: { id: currentUserId },
          city: { id: cityId },
        },
      });
      isUnlocked = !!userCity;
    }

    return {
      id: city.id,
      name: city.name,
      nameEn: city.nameEn,
      country: city.country,
      countryCode: city.countryCode,
      province: city.province,
      coverImage: city.coverImage,
      latitude: Number(city.latitude),
      longitude: Number(city.longitude),
      description: city.description,
      postsCount: city.postsCount,
      visitorsCount: city.visitorsCount,
      isUnlocked,
    };
  }

  /**
   * 签到打卡（点亮城市）
   */
  async checkIn(cityId: string, userId: string): Promise<{ message: string }> {
    const city = await this.cityRepository.findOne({
      where: { id: cityId },
    });
    if (!city) {
      throw new NotFoundException('城市不存在');
    }

    // 检查是否已点亮
    const existing = await this.userCityRepository.findOne({
      where: {
        user: { id: userId },
        city: { id: cityId },
      },
    });
    if (existing) {
      throw new ConflictException('已经点亮过该城市');
    }

    // 创建签到记录
    const userCity = this.userCityRepository.create({
      user: { id: userId } as any,
      city: { id: cityId } as any,
    });
    await this.userCityRepository.save(userCity);

    // 更新城市访客数
    city.visitorsCount += 1;
    await this.cityRepository.save(city);

    // 更新用户点亮城市数
    const user = await this.userService.findByIdOrFail(userId);
    user.citiesCount += 1;

    // 检查是否点亮了新国家
    const userCities = await this.userCityRepository.find({
      where: { user: { id: userId } },
      relations: ['city'],
    });
    const countries = new Set(userCities.map((uc) => uc.city.countryCode));
    // 加上刚才点亮的城市的国家
    countries.add(city.countryCode);
    user.countriesCount = countries.size;

    await this.userService.update(user.id, {});

    return { message: `成功点亮 ${city.name}！` };
  }

  /**
   * 获取用户已点亮的城市列表
   */
  async getUserCities(userId: string): Promise<CityListItem[]> {
    const userCities = await this.userCityRepository.find({
      where: { user: { id: userId } },
      relations: ['city'],
      order: { createdAt: 'DESC' },
    });

    return userCities.map((uc) => ({
      id: uc.city.id,
      name: uc.city.name,
      nameEn: uc.city.nameEn,
      country: uc.city.country,
      countryCode: uc.city.countryCode,
      province: uc.city.province,
      coverImage: uc.city.coverImage,
      latitude: Number(uc.city.latitude),
      longitude: Number(uc.city.longitude),
      description: uc.city.description,
      postsCount: uc.city.postsCount,
      visitorsCount: uc.city.visitorsCount,
      isUnlocked: true,
    }));
  }

  /**
   * 获取地图标记点数据
   */
  async getMarkers(currentUserId?: string): Promise<any[]> {
    const cities = await this.cityRepository.find();

    let unlockedCityIds: Set<string> = new Set();
    if (currentUserId) {
      const userCities = await this.userCityRepository.find({
        where: { user: { id: currentUserId } },
        relations: ['city'],
      });
      unlockedCityIds = new Set(userCities.map((uc) => uc.city.id));
    }

    return cities.map((city) => ({
      id: city.id,
      name: city.name,
      latitude: Number(city.latitude),
      longitude: Number(city.longitude),
      isUnlocked: unlockedCityIds.has(city.id),
      hasContent: city.postsCount > 0,
      type: city.visitorsCount > 100 ? 'hot' : unlockedCityIds.has(city.id) ? 'normal' : 'fog',
    }));
  }
}