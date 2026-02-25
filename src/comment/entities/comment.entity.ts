import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Post } from '../../post/entities/post.entity';

@Entity('comments')
export class Comment extends BaseEntity {
  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  @Index()
  post: Post;

  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user: User;

  @Column({ type: 'text' })
  content: string;

  // 父评论（null = 顶级评论）
  @ManyToOne(() => Comment, (comment) => comment.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Comment | null;

  // 根评论（便于查整棵评论树）
  @ManyToOne(() => Comment, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'root_id' })
  @Index()
  root: Comment | null;

  // 回复目标用户
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reply_to_user_id' })
  replyToUser: User | null;

  @Column({ name: 'like_count', default: 0 })
  likeCount: number;

  // 子评论
  @OneToMany(() => Comment, (comment) => comment.parent)
  children: Comment[];
}