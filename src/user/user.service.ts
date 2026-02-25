import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserFollow } from './entities/user-follow.entity';
import { UpdateUserDto } from './dto/update-user.dto';

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  avatar: string;
  bio: string | null;
  level: number;
  levelTitle: string;
  followingCount: number;
  followersCount: number;
  friendsCount: number;
  citiesCount: number;
  countriesCount: number;
  postsCount: number;
  createdAt: Date;
}

export interface UserRelation {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isFriend: boolean;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserFollow)
    private readonly userFollowRepository: Repository<UserFollow>,
  ) {}

  /**
   * 注册 - 创建新用户
   */
  async create(email: string, password: string, nickname: string): Promise<User> {
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('该邮箱已被注册');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      nickname,
      avatar: '',
      level: 1,
      levelTitle: '迷雾行者',
    });

    return await this.userRepository.save(user);
  }

  /**
   * 通过邮箱查找用户（登录用，包含密码）
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'nickname', 'avatar', 'level', 'levelTitle'],
    });
  }

  /**
   * 通过 ID 查找用户
   */
  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  /**
   * 通过 ID 查找用户（不存在则抛异常）
   */
  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  /**
   * 获取用户主页信息（含与当前用户的关系）
   */
  async getUserProfile(targetUserId: string, currentUserId?: string): Promise<{
    profile: UserProfile;
    relation: UserRelation | null;
  }> {
    const user = await this.findByIdOrFail(targetUserId);

    const profile: UserProfile = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      bio: user.bio,
      level: user.level,
      levelTitle: user.levelTitle,
      followingCount: user.followingCount,
      followersCount: user.followersCount,
      friendsCount: user.friendsCount,
      citiesCount: user.citiesCount,
      countriesCount: user.countriesCount,
      postsCount: user.postsCount,
      createdAt: user.createdAt,
    };

    let relation: UserRelation | null = null;

    if (currentUserId && currentUserId !== targetUserId) {
      relation = await this.getRelation(currentUserId, targetUserId);
    }

    return { profile, relation };
  }

  /**
   * 更新用户资料
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findByIdOrFail(id);

    if (updateUserDto.nickname !== undefined) {
      user.nickname = updateUserDto.nickname;
    }
    if (updateUserDto.avatar !== undefined) {
      user.avatar = updateUserDto.avatar;
    }
    if (updateUserDto.bio !== undefined) {
      user.bio = updateUserDto.bio;
    }

    return await this.userRepository.save(user);
  }

  /**
   * 验证密码
   */
  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // ============================================================
  // 关注系统
  // ============================================================

  /**
   * 关注用户
   */
  async follow(followerId: string, followingId: string): Promise<{ isFollowing: boolean; isFriend: boolean }> {
    if (followerId === followingId) {
      throw new BadRequestException('不能关注自己');
    }

    const follower = await this.findByIdOrFail(followerId);
    const following = await this.findByIdOrFail(followingId);

    // 检查是否已关注
    const existing = await this.userFollowRepository.findOne({
      where: {
        follower: { id: followerId },
        following: { id: followingId },
      },
    });
    if (existing) {
      throw new ConflictException('已经关注了该用户');
    }

    // 创建关注记录
    const follow = this.userFollowRepository.create({
      follower: { id: followerId } as any,
      following: { id: followingId } as any,
    });
    await this.userFollowRepository.save(follow);

    // 更新计数
    follower.followingCount += 1;
    following.followersCount += 1;

    // 检查是否互关（变成朋友）
    const reverseFollow = await this.userFollowRepository.findOne({
      where: {
        follower: { id: followingId },
        following: { id: followerId },
      },
    });

    const isFriend = !!reverseFollow;
    if (isFriend) {
      follower.friendsCount += 1;
      following.friendsCount += 1;
    }

    await this.userRepository.save(follower);
    await this.userRepository.save(following);

    return { isFollowing: true, isFriend };
  }

  /**
   * 取消关注
   */
  async unfollow(followerId: string, followingId: string): Promise<{ isFollowing: boolean; isFriend: boolean }> {
    if (followerId === followingId) {
      throw new BadRequestException('不能取消关注自己');
    }

    const follow = await this.userFollowRepository.findOne({
      where: {
        follower: { id: followerId },
        following: { id: followingId },
      },
    });
    if (!follow) {
      throw new NotFoundException('未关注该用户');
    }

    // 检查取关前是否是互关
    const reverseFollow = await this.userFollowRepository.findOne({
      where: {
        follower: { id: followingId },
        following: { id: followerId },
      },
    });
    const wasFriend = !!reverseFollow;

    // 删除关注记录
    await this.userFollowRepository.remove(follow);

    // 更新计数
    const follower = await this.findByIdOrFail(followerId);
    const following = await this.findByIdOrFail(followingId);

    follower.followingCount = Math.max(0, follower.followingCount - 1);
    following.followersCount = Math.max(0, following.followersCount - 1);

    if (wasFriend) {
      follower.friendsCount = Math.max(0, follower.friendsCount - 1);
      following.friendsCount = Math.max(0, following.friendsCount - 1);
    }

    await this.userRepository.save(follower);
    await this.userRepository.save(following);

    return { isFollowing: false, isFriend: false };
  }

  /**
   * 获取两个用户之间的关系
   */
  async getRelation(userId: string, targetId: string): Promise<UserRelation> {
    const isFollowing = await this.userFollowRepository.findOne({
      where: {
        follower: { id: userId },
        following: { id: targetId },
      },
    });

    const isFollowedBy = await this.userFollowRepository.findOne({
      where: {
        follower: { id: targetId },
        following: { id: userId },
      },
    });

    return {
      isFollowing: !!isFollowing,
      isFollowedBy: !!isFollowedBy,
      isFriend: !!isFollowing && !!isFollowedBy,
    };
  }

  /**
   * 获取关注列表
   */
  async getFollowingList(userId: string, page: number = 1, limit: number = 20): Promise<{
    items: UserProfile[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const [follows, total] = await this.userFollowRepository.findAndCount({
      where: { follower: { id: userId } },
      relations: ['following'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const items: UserProfile[] = follows.map((f) => ({
      id: f.following.id,
      email: f.following.email,
      nickname: f.following.nickname,
      avatar: f.following.avatar,
      bio: f.following.bio,
      level: f.following.level,
      levelTitle: f.following.levelTitle,
      followingCount: f.following.followingCount,
      followersCount: f.following.followersCount,
      friendsCount: f.following.friendsCount,
      citiesCount: f.following.citiesCount,
      countriesCount: f.following.countriesCount,
      postsCount: f.following.postsCount,
      createdAt: f.following.createdAt,
    }));

    return { items, total };
  }

  /**
   * 获取粉丝列表
   */
  async getFollowersList(userId: string, page: number = 1, limit: number = 20): Promise<{
    items: UserProfile[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const [follows, total] = await this.userFollowRepository.findAndCount({
      where: { following: { id: userId } },
      relations: ['follower'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const items: UserProfile[] = follows.map((f) => ({
      id: f.follower.id,
      email: f.follower.email,
      nickname: f.follower.nickname,
      avatar: f.follower.avatar,
      bio: f.follower.bio,
      level: f.follower.level,
      levelTitle: f.follower.levelTitle,
      followingCount: f.follower.followingCount,
      followersCount: f.follower.followersCount,
      friendsCount: f.follower.friendsCount,
      citiesCount: f.follower.citiesCount,
      countriesCount: f.follower.countriesCount,
      postsCount: f.follower.postsCount,
      createdAt: f.follower.createdAt,
    }));

    return { items, total };
  }

  /**
   * 直接保存用户实体（供其他模块更新计数用）
   */
  async saveUser(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }
}