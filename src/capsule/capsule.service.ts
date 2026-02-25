import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { TimeCapsule } from './entities/time-capsule.entity';
import { UserService } from '../user/user.service';
import { CreateCapsuleDto } from './dto/create-capsule.dto';

export interface CapsuleItem {
  id: string;
  content: string;
  images: string[];
  targetDate: Date;
  cityName: string | null;
  address: string | null;
  status: 'locked' | 'unlocked';
  createdAt: Date;
}

@Injectable()
export class CapsuleService {
  constructor(
    @InjectRepository(TimeCapsule)
    private readonly capsuleRepository: Repository<TimeCapsule>,

    private readonly userService: UserService,
  ) {}

  /**
   * 创建时空胶囊
   */
  async create(userId: string, createCapsuleDto: CreateCapsuleDto): Promise<TimeCapsule> {
    const user = await this.userService.findByIdOrFail(userId);

    // 校验目标日期必须在未来
    const targetDate = new Date(createCapsuleDto.targetDate);
    if (targetDate <= new Date()) {
      throw new BadRequestException('解封日期必须在未来');
    }

    const capsule = this.capsuleRepository.create({
      user,
      content: createCapsuleDto.content,
      images: createCapsuleDto.images || [],
      targetDate,
      cityName: createCapsuleDto.cityName || null,
      address: createCapsuleDto.address || null,
      status: 'locked',
    });

    return await this.capsuleRepository.save(capsule);
  }

  /**
   * 获取我的胶囊列表
   */
  async getMyCapsules(userId: string): Promise<CapsuleItem[]> {
    // 先自动解锁到期的胶囊
    await this.autoUnlock(userId);

    const capsules = await this.capsuleRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });

    return capsules.map((c) => ({
      id: c.id,
      content: c.status === 'locked' ? '🔒 胶囊未到解封时间' : c.content,
      images: c.status === 'locked' ? [] : c.images,
      targetDate: c.targetDate,
      cityName: c.cityName,
      address: c.address,
      status: c.status,
      createdAt: c.createdAt,
    }));
  }

  /**
   * 获取胶囊详情
   */
  async findOne(capsuleId: string, userId: string): Promise<CapsuleItem> {
    const capsule = await this.capsuleRepository.findOne({
      where: { id: capsuleId },
      relations: ['user'],
    });

    if (!capsule) {
      throw new NotFoundException('胶囊不存在');
    }

    if (capsule.user.id !== userId) {
      throw new ForbiddenException('只能查看自己的胶囊');
    }

    // 检查是否到期，自动解锁
    if (capsule.status === 'locked' && new Date() >= capsule.targetDate) {
      capsule.status = 'unlocked';
      await this.capsuleRepository.save(capsule);
    }

    return {
      id: capsule.id,
      content: capsule.status === 'locked' ? '🔒 胶囊未到解封时间' : capsule.content,
      images: capsule.status === 'locked' ? [] : capsule.images,
      targetDate: capsule.targetDate,
      cityName: capsule.cityName,
      address: capsule.address,
      status: capsule.status,
      createdAt: capsule.createdAt,
    };
  }

  /**
   * 删除胶囊
   */
  async remove(capsuleId: string, userId: string): Promise<void> {
    const capsule = await this.capsuleRepository.findOne({
      where: { id: capsuleId },
      relations: ['user'],
    });

    if (!capsule) {
      throw new NotFoundException('胶囊不存在');
    }

    if (capsule.user.id !== userId) {
      throw new ForbiddenException('只能删除自己的胶囊');
    }

    await this.capsuleRepository.softRemove(capsule);
  }

  /**
   * 自动解锁到期的胶囊
   */
  private async autoUnlock(userId: string): Promise<void> {
    await this.capsuleRepository
      .createQueryBuilder()
      .update(TimeCapsule)
      .set({ status: 'unlocked' })
      .where('user_id = :userId', { userId })
      .andWhere('status = :status', { status: 'locked' })
      .andWhere('target_date <= :now', { now: new Date() })
      .execute();
  }
}