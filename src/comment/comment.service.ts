import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Post } from '../post/entities/post.entity';
import { UserService } from '../user/user.service';
import { CreateCommentDto } from './dto/create-comment.dto';

export interface CommentItem {
  id: string;
  content: string;
  likeCount: number;
  createdAt: Date;
  user: {
    id: string;
    nickname: string;
    avatar: string;
    level: number;
    levelTitle: string;
  };
  replyToUser: {
    id: string;
    nickname: string;
  } | null;
  children?: CommentItem[];
}

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,

    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    private readonly userService: UserService,
  ) {}

  /**
   * 发表评论
   */
  async create(userId: string, createCommentDto: CreateCommentDto): Promise<Comment> {
    const { postId, content, parentId, replyToUserId } = createCommentDto;

    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('动态不存在');
    }

    const user = await this.userService.findByIdOrFail(userId);

    const comment = this.commentRepository.create({
      post: { id: postId } as any,
      user,
      content,
    });

    if (parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: parentId },
      });
      if (!parentComment) {
        throw new NotFoundException('被回复的评论不存在');
      }

      comment.parent = parentComment;

      if (parentComment.root) {
        comment.root = parentComment.root;
      } else {
        comment.root = parentComment;
      }
    }

    if (replyToUserId) {
      const replyToUser = await this.userService.findById(replyToUserId);
      if (replyToUser) {
        comment.replyToUser = replyToUser;
      }
    }

    const savedComment = await this.commentRepository.save(comment);

    post.commentCount += 1;
    await this.postRepository.save(post);

    return savedComment;
  }

  /**
   * 获取帖子的评论列表（两级结构）
   */
  async findByPostId(
    postId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ items: CommentItem[]; total: number }> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('动态不存在');
    }

    const skip = (page - 1) * limit;

    const [topComments, total] = await this.commentRepository.findAndCount({
      where: {
        post: { id: postId },
        parent: IsNull(),
      },
      relations: ['user', 'replyToUser'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const items: CommentItem[] = [];

    for (const topComment of topComments) {
      const children = await this.commentRepository.find({
        where: {
          root: { id: topComment.id },
        },
        relations: ['user', 'replyToUser'],
        order: { createdAt: 'ASC' },
        take: 50,
      });

      const commentItem: CommentItem = {
        id: topComment.id,
        content: topComment.content,
        likeCount: topComment.likeCount,
        createdAt: topComment.createdAt,
        user: {
          id: topComment.user.id,
          nickname: topComment.user.nickname,
          avatar: topComment.user.avatar,
          level: topComment.user.level,
          levelTitle: topComment.user.levelTitle,
        },
        replyToUser: null,
        children: children.map((child) => ({
          id: child.id,
          content: child.content,
          likeCount: child.likeCount,
          createdAt: child.createdAt,
          user: {
            id: child.user.id,
            nickname: child.user.nickname,
            avatar: child.user.avatar,
            level: child.user.level,
            levelTitle: child.user.levelTitle,
          },
          replyToUser: child.replyToUser
            ? { id: child.replyToUser.id, nickname: child.replyToUser.nickname }
            : null,
        })),
      };

      items.push(commentItem);
    }

    return { items, total };
  }

  /**
   * 删除评论（级联软删除）
   * 删除该评论 + 所有子评论
   */
  async remove(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user', 'post'],
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.user.id !== userId) {
      throw new ForbiddenException('只能删除自己的评论');
    }

    // 计算需要删除的总数（自身 + 子评论）
    let deleteCount = 1;

    // 判断是否是顶级评论
    const isTopLevel = !comment.parent;

    if (isTopLevel) {
      // 顶级评论：删除所有以该评论为 root 的子评论
      const childComments = await this.commentRepository.find({
        where: { root: { id: commentId } },
      });
      deleteCount += childComments.length;

      // 批量软删除子评论
      if (childComments.length > 0) {
        await this.commentRepository.softRemove(childComments);
      }
    } else {
      // 非顶级评论：删除所有以该评论为 parent 的直接子评论
      // 以及递归删除更深层的子评论
      const descendantIds = await this.findAllDescendantIds(commentId);
      deleteCount += descendantIds.length;

      if (descendantIds.length > 0) {
        // 批量软删除所有后代评论
        const descendants = await this.commentRepository.findByIds(descendantIds);
        await this.commentRepository.softRemove(descendants);
      }
    }

    // 软删除自身
    await this.commentRepository.softRemove(comment);

    // 更新帖子评论计数
    comment.post.commentCount = Math.max(0, comment.post.commentCount - deleteCount);
    await this.postRepository.save(comment.post);
  }

  /**
   * 递归查找某条评论的所有后代评论 ID
   */
  private async findAllDescendantIds(parentId: string): Promise<string[]> {
    const allIds: string[] = [];

    // 查找直接子评论
    const directChildren = await this.commentRepository.find({
      where: { parent: { id: parentId } },
      select: ['id'],
    });

    for (const child of directChildren) {
      allIds.push(child.id);
      // 递归查找更深层的子评论
      const deeperIds = await this.findAllDescendantIds(child.id);
      allIds.push(...deeperIds);
    }

    return allIds;
  }
}