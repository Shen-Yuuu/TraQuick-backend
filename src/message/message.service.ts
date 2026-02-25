import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { QueryMessageDto } from './dto/query-message.dto';

export interface MessageItem {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  relatedUser: {
    id: string;
    nickname: string;
    avatar: string;
  } | null;
  relatedPost: {
    id: string;
    content: string;
  } | null;
}

export interface MessageGroupItem {
  type: string;
  unreadCount: number;
  latestMessage: MessageItem | null;
}

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  /**
   * 创建消息（供其他模块调用）
   */
  async create(data: {
    userId: string;
    type: 'like' | 'comment' | 'follow' | 'system' | 'capsule' | 'bottle';
    title: string;
    content: string;
    relatedUserId?: string;
    relatedPostId?: string;
  }): Promise<Message> {
    const message = this.messageRepository.create({
      user: { id: data.userId } as any,
      type: data.type,
      title: data.title,
      content: data.content,
      isRead: false,
    });

    if (data.relatedUserId) {
      message.relatedUser = { id: data.relatedUserId } as any;
    }
    if (data.relatedPostId) {
      message.relatedPost = { id: data.relatedPostId } as any;
    }

    return await this.messageRepository.save(message);
  }

  /**
   * 获取我的消息列表
   */
  async getMyMessages(
    userId: string,
    queryDto: QueryMessageDto,
  ): Promise<{ items: MessageItem[]; total: number; unreadTotal: number }> {
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.messageRepository
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.relatedUser', 'relatedUser')
      .leftJoinAndSelect('msg.relatedPost', 'relatedPost')
      .where('msg.user_id = :userId', { userId });

    // 按消息类型筛选
    if (queryDto.type) {
      qb.andWhere('msg.type = :type', { type: queryDto.type });
    }

    // 按已读状态筛选
    if (queryDto.isRead !== undefined) {
      qb.andWhere('msg.is_read = :isRead', { isRead: queryDto.isRead });
    }

    qb.orderBy('msg.createdAt', 'DESC');
    qb.skip(skip).take(limit);

    const [messages, total] = await qb.getManyAndCount();

    // 查询未读总数
    const unreadTotal = await this.messageRepository.count({
      where: { user: { id: userId }, isRead: false },
    });

    const items: MessageItem[] = messages.map((msg) => ({
      id: msg.id,
      type: msg.type,
      title: msg.title,
      content: msg.content,
      isRead: msg.isRead,
      createdAt: msg.createdAt,
      relatedUser: msg.relatedUser
        ? {
            id: msg.relatedUser.id,
            nickname: msg.relatedUser.nickname,
            avatar: msg.relatedUser.avatar,
          }
        : null,
      relatedPost: msg.relatedPost
        ? {
            id: msg.relatedPost.id,
            content: msg.relatedPost.content,
          }
        : null,
    }));

    return { items, total, unreadTotal };
  }

  /**
   * 获取消息分组概览（按类型分组）
   */
  async getMessageGroups(userId: string): Promise<MessageGroupItem[]> {
    const types: string[] = ['like', 'comment', 'follow', 'system', 'capsule', 'bottle'];
    const groups: MessageGroupItem[] = [];

    for (const type of types) {
      const unreadCount = await this.messageRepository.count({
        where: { user: { id: userId }, type: type as any, isRead: false },
      });

      const latestMsg = await this.messageRepository.findOne({
        where: { user: { id: userId }, type: type as any },
        relations: ['relatedUser', 'relatedPost'],
        order: { createdAt: 'DESC' },
      });

      groups.push({
        type,
        unreadCount,
        latestMessage: latestMsg
          ? {
              id: latestMsg.id,
              type: latestMsg.type,
              title: latestMsg.title,
              content: latestMsg.content,
              isRead: latestMsg.isRead,
              createdAt: latestMsg.createdAt,
              relatedUser: latestMsg.relatedUser
                ? {
                    id: latestMsg.relatedUser.id,
                    nickname: latestMsg.relatedUser.nickname,
                    avatar: latestMsg.relatedUser.avatar,
                  }
                : null,
              relatedPost: latestMsg.relatedPost
                ? {
                    id: latestMsg.relatedPost.id,
                    content: latestMsg.relatedPost.content,
                  }
                : null,
            }
          : null,
      });
    }

    return groups;
  }

  /**
   * 标记消息为已读
   */
  async markAsRead(messageId: string, userId: string): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId, user: { id: userId } },
    });

    if (!message) {
      throw new NotFoundException('消息不存在');
    }

    message.isRead = true;
    await this.messageRepository.save(message);
  }

  /**
   * 全部标记为已读
   */
  async markAllAsRead(userId: string, type?: string): Promise<{ count: number }> {
    const qb = this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('user_id = :userId', { userId })
      .andWhere('is_read = false');

    if (type) {
      qb.andWhere('type = :type', { type });
    }

    const result = await qb.execute();
    return { count: result.affected || 0 };
  }
}