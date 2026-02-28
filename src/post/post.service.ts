import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { PostCollect } from './entities/post-collect.entity';
import { UserService } from '../user/user.service';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { Inject, forwardRef } from '@nestjs/common';
import { MessageService } from '../message/message.service';

// 列表返回的单条数据结构
export interface PostListItem {
  id: string;
  content: string;
  images: string[];
  video: string | null;
  type: 'image' | 'video';
  tags: string[];
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  collectCount: number;
  createdAt: Date;
  author: {
    id: string;
    nickname: string;
    avatar: string;
    level: number;
    levelTitle: string;
  };
  city: {
    id: string;
    name: string;
  } | null;
  isLiked: boolean;
  isCollected: boolean;
}

// 分页返回结构
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,

    @InjectRepository(PostCollect)
    private readonly postCollectRepository: Repository<PostCollect>,

    @Inject(forwardRef(() => MessageService))
    private readonly messageService: MessageService,

    private readonly userService: UserService,
  ) {}

  // ============================================================
  // 发布动态
  // ============================================================
  async create(userId: string, createPostDto: CreatePostDto): Promise<Post> {
    const author = await this.userService.findByIdOrFail(userId);

    const post = this.postRepository.create({
      author,
      content: createPostDto.content,
      images: createPostDto.images || [],
      video: createPostDto.video || null,
      type: createPostDto.type,
      tags: createPostDto.tags || [],
      address: createPostDto.address || null,
      latitude: createPostDto.latitude || null,
      longitude: createPostDto.longitude || null,
    });

    // 如果传了 cityId，关联城市
    if (createPostDto.cityId) {
      post.city = { id: createPostDto.cityId } as any;
    }

    const savedPost = await this.postRepository.save(post);

    // 更新用户发帖计数
    author.postsCount += 1;
    await this.userService.update(author.id, {});

    return savedPost;
  }

  // ============================================================
  // 获取动态列表（分页 + 筛选 + 排序 + 用户状态）
  // ============================================================
  async findAll(
    queryDto: QueryPostDto,
    currentUserId?: string,
  ): Promise<PaginatedResult<PostListItem>> {
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    // 基础查询
    const qb = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.city', 'city')
      .where('post.deletedAt IS NULL');

    // ====== 筛选条件 ======
    if (queryDto.authorId) {
      qb.andWhere('author.id = :authorId', { authorId: queryDto.authorId });
    }

    if (queryDto.cityId) {
      qb.andWhere('city.id = :cityId', { cityId: queryDto.cityId });
    }

    if (queryDto.tag) {
      qb.andWhere(':tag = ANY(post.tags)', { tag: queryDto.tag });
    }

    if (queryDto.likedBy) {
      qb.innerJoin('post.likes', 'postLike', 'postLike.user_id = :likedBy', { 
        likedBy: queryDto.likedBy 
      });
    }

    if (queryDto.collectedBy) {
      qb.innerJoin('post.collects', 'postCollect', 'postCollect.user_id = :collectedBy', { 
        collectedBy: queryDto.collectedBy 
      });
    }

    if (queryDto.feedType && currentUserId) {
      if (queryDto.feedType === 'following') {
        // 只看我关注的人的帖子
        qb.innerJoin(
          'user_follows', 
          'uf', 
          'uf.following_id = author.id AND uf.follower_id = :currentUserId',
          { currentUserId }
        );
      } else if (queryDto.feedType === 'friends') {
        // 只看互相关注（朋友）的帖子
        // 条件1: 我关注了他
        qb.innerJoin(
          'user_follows', 
          'uf1', 
          'uf1.following_id = author.id AND uf1.follower_id = :currentUserId',
          { currentUserId }
        );
        // 条件2: 他也关注了我
        qb.innerJoin(
          'user_follows', 
          'uf2', 
          'uf2.follower_id = author.id AND uf2.following_id = :currentUserId',
          { currentUserId }
        );
      }
    }

    // ====== 排序 ======
    if (queryDto.orderBy === 'hot') {
      // 热门：按点赞数 → 评论数 → 时间 多字段排序
      qb.orderBy('post.likeCount', 'DESC');
      qb.addOrderBy('post.commentCount', 'DESC');
      qb.addOrderBy('post.createdAt', 'DESC');
    } else {
      // 默认：时间倒序
      qb.orderBy('post.createdAt', 'DESC');
    }

    // ====== 分页 ======
    qb.skip(skip).take(limit);

    const [posts, total] = await qb.getManyAndCount();

    // ====== 填充 isLiked / isCollected ======
    let likedPostIds: Set<string> = new Set();
    let collectedPostIds: Set<string> = new Set();

    if (currentUserId && posts.length > 0) {
      const postIds = posts.map((p) => p.id);

      // 批量查询当前用户的点赞记录
      const likes = await this.postLikeRepository
        .createQueryBuilder('pl')
        .select('pl.post_id', 'postId')
        .where('pl.user_id = :userId', { userId: currentUserId })
        .andWhere('pl.post_id IN (:...postIds)', { postIds })
        .getRawMany();

      likedPostIds = new Set(likes.map((l: { postId: string }) => l.postId));

      // 批量查询当前用户的收藏记录
      const collects = await this.postCollectRepository
        .createQueryBuilder('pc')
        .select('pc.post_id', 'postId')
        .where('pc.user_id = :userId', { userId: currentUserId })
        .andWhere('pc.post_id IN (:...postIds)', { postIds })
        .getRawMany();

      collectedPostIds = new Set(collects.map((c: { postId: string }) => c.postId));
    }

    // ====== 组装返回数据 ======
    const items: PostListItem[] = posts.map((post) => ({
      id: post.id,
      content: post.content,
      images: post.images,
      video: post.video,
      type: post.type,
      tags: post.tags,
      address: post.address,
      latitude: post.latitude ? Number(post.latitude) : null,
      longitude: post.longitude ? Number(post.longitude) : null,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount,
      collectCount: post.collectCount,
      createdAt: post.createdAt,
      author: {
        id: post.author.id,
        nickname: post.author.nickname,
        avatar: post.author.avatar,
        level: post.author.level,
        levelTitle: post.author.levelTitle,
      },
      city: post.city
        ? { id: post.city.id, name: post.city.name }
        : null,
      isLiked: likedPostIds.has(post.id),
      isCollected: collectedPostIds.has(post.id),
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================================
  // 获取动态详情
  // ============================================================
  async findOne(postId: string, currentUserId?: string): Promise<PostListItem> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['author', 'city'],
    });

    if (!post) {
      throw new NotFoundException('动态不存在');
    }

    // 查询当前用户状态
    let isLiked = false;
    let isCollected = false;

    if (currentUserId) {
      const like = await this.postLikeRepository.findOne({
        where: {
          user: { id: currentUserId },
          post: { id: postId },
        },
      });
      isLiked = !!like;

      const collect = await this.postCollectRepository.findOne({
        where: {
          user: { id: currentUserId },
          post: { id: postId },
        },
      });
      isCollected = !!collect;
    }

    return {
      id: post.id,
      content: post.content,
      images: post.images,
      video: post.video,
      type: post.type,
      tags: post.tags,
      address: post.address,
      latitude: post.latitude,
      longitude: post.longitude,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount,
      collectCount: post.collectCount,
      createdAt: post.createdAt,
      author: {
        id: post.author.id,
        nickname: post.author.nickname,
        avatar: post.author.avatar,
        level: post.author.level,
        levelTitle: post.author.levelTitle,
      },
      city: post.city
        ? { id: post.city.id, name: post.city.name }
        : null,
      isLiked,
      isCollected,
    };
  }

  // ============================================================
  // 删除动态（软删除，仅作者可删）
  // ============================================================
  async remove(postId: string, userId: string): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('动态不存在');
    }

    if (post.author.id !== userId) {
      throw new ForbiddenException('只能删除自己的动态');
    }

    await this.postRepository.softRemove(post);

    // 更新用户发帖计数
    const author = await this.userService.findByIdOrFail(userId);
    author.postsCount = Math.max(0, author.postsCount - 1);
    await this.userService.update(author.id, {});
  }

  // ============================================================
  // 点赞
  // ============================================================
  async like(postId: string, userId: string): Promise<{ likeCount: number }> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['author'],
    });
    if (!post) {
      throw new NotFoundException('动态不存在');
    }

    const existing = await this.postLikeRepository.findOne({
      where: {
        user: { id: userId },
        post: { id: postId },
      },
    });
    if (existing) {
      throw new ConflictException('已经点赞过了');
    }

    const like = this.postLikeRepository.create({
      user: { id: userId } as any,
      post: { id: postId } as any,
    });
    await this.postLikeRepository.save(like);

    post.likeCount += 1;
    await this.postRepository.save(post);

    // 发送点赞通知（不通知自己）
    if (post.author.id !== userId) {
      const liker = await this.userService.findByIdOrFail(userId);
      await this.messageService.create({
        userId: post.author.id,
        type: 'like',
        title: '收到点赞',
        content: `${liker.nickname} 赞了你的动态`,
        relatedUserId: userId,
        relatedPostId: postId,
      });
    }

    return { likeCount: post.likeCount };
  }

  // ============================================================
  // 取消点赞
  // ============================================================
  async unlike(postId: string, userId: string): Promise<{ likeCount: number }> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('动态不存在');
    }

    const like = await this.postLikeRepository.findOne({
      where: {
        user: { id: userId },
        post: { id: postId },
      },
    });
    if (!like) {
      throw new NotFoundException('未点赞，无法取消');
    }

    await this.postLikeRepository.remove(like);

    // 更新计数
    post.likeCount = Math.max(0, post.likeCount - 1);
    await this.postRepository.save(post);

    return { likeCount: post.likeCount };
  }

  // ============================================================
  // 收藏
  // ============================================================
  async collect(postId: string, userId: string): Promise<{ collectCount: number }> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('动态不存在');
    }

    const existing = await this.postCollectRepository.findOne({
      where: {
        user: { id: userId },
        post: { id: postId },
      },
    });
    if (existing) {
      throw new ConflictException('已经收藏过了');
    }

    const collect = this.postCollectRepository.create({
      user: { id: userId } as any,
      post: { id: postId } as any,
    });
    await this.postCollectRepository.save(collect);

    post.collectCount += 1;
    await this.postRepository.save(post);

    return { collectCount: post.collectCount };
  }

  // ============================================================
  // 取消收藏
  // ============================================================
  async uncollect(postId: string, userId: string): Promise<{ collectCount: number }> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('动态不存在');
    }

    const collect = await this.postCollectRepository.findOne({
      where: {
        user: { id: userId },
        post: { id: postId },
      },
    });
    if (!collect) {
      throw new NotFoundException('未收藏，无法取消');
    }

    await this.postCollectRepository.remove(collect);

    post.collectCount = Math.max(0, post.collectCount - 1);
    await this.postRepository.save(post);

    return { collectCount: post.collectCount };
  }
}