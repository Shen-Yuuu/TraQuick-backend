import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { DriftBottle } from './entities/drift-bottle.entity';
import { UserService } from '../user/user.service';
import { CreateBottleDto } from './dto/create-bottle.dto';

export interface BottleItem {
  id: string;
  content: string;
  type: 'wish' | 'story' | 'question';
  senderNickname: string;
  senderCity: string | null;
  createdAt: Date;
}

@Injectable()
export class BottleService {
  constructor(
    @InjectRepository(DriftBottle)
    private readonly bottleRepository: Repository<DriftBottle>,

    private readonly userService: UserService,
  ) {}

  /**
   * 投放漂流瓶
   */
  async create(userId: string, createBottleDto: CreateBottleDto): Promise<DriftBottle> {
    const sender = await this.userService.findByIdOrFail(userId);

    const bottle = this.bottleRepository.create({
      sender,
      content: createBottleDto.content,
      type: createBottleDto.type,
    });

    if (createBottleDto.cityId) {
      bottle.city = { id: createBottleDto.cityId } as any;
    }

    return await this.bottleRepository.save(bottle);
  }

  /**
   * 随机捡一个漂流瓶
   * 规则：只能捡别人投的、还没被捡起的瓶子
   */
  async pickRandom(userId: string): Promise<BottleItem> {
    // 查询所有未被捡起的、不是自己投的瓶子
    const bottles = await this.bottleRepository
      .createQueryBuilder('bottle')
      .leftJoinAndSelect('bottle.sender', 'sender')
      .leftJoinAndSelect('bottle.city', 'city')
      .where('bottle.picker IS NULL')
      .andWhere('sender.id != :userId', { userId })
      .orderBy('RANDOM()')
      .limit(1)
      .getMany();

    if (bottles.length === 0) {
      throw new NotFoundException('海面上暂时没有漂流瓶，过会再来看看吧~');
    }

    const bottle = bottles[0];

    // 标记为已捡起
    const picker = await this.userService.findByIdOrFail(userId);
    bottle.picker = picker;
    bottle.pickedAt = new Date();
    await this.bottleRepository.save(bottle);

    return {
      id: bottle.id,
      content: bottle.content,
      type: bottle.type,
      senderNickname: bottle.sender.nickname,
      senderCity: bottle.city?.name || null,
      createdAt: bottle.createdAt,
    };
  }

  /**
   * 获取我投放的瓶子列表
   */
  async getMySentBottles(userId: string): Promise<BottleItem[]> {
    const bottles = await this.bottleRepository.find({
      where: { sender: { id: userId } },
      relations: ['sender', 'city'],
      order: { createdAt: 'DESC' },
    });

    return bottles.map((bottle) => ({
      id: bottle.id,
      content: bottle.content,
      type: bottle.type,
      senderNickname: bottle.sender.nickname,
      senderCity: bottle.city?.name || null,
      createdAt: bottle.createdAt,
    }));
  }

  /**
   * 获取我捡到的瓶子列表
   */
  async getMyPickedBottles(userId: string): Promise<BottleItem[]> {
    const bottles = await this.bottleRepository.find({
      where: { picker: { id: userId } },
      relations: ['sender', 'city'],
      order: { pickedAt: 'DESC' },
    });

    return bottles.map((bottle) => ({
      id: bottle.id,
      content: bottle.content,
      type: bottle.type,
      senderNickname: bottle.sender.nickname,
      senderCity: bottle.city?.name || null,
      createdAt: bottle.createdAt,
    }));
  }
}