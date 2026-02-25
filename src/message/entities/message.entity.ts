import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Post } from '../../post/entities/post.entity';

@Entity('messages')
export class Message extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user: User;

  @Column({
    type: 'enum',
    enum: ['like', 'comment', 'follow', 'system', 'capsule', 'bottle'],
  })
  type: 'like' | 'comment' | 'follow' | 'system' | 'capsule' | 'bottle';

  @Column({type: 'varchar'})
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_read', default: false })
  @Index()
  isRead: boolean;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'related_user_id' })
  relatedUser: User | null;

  @ManyToOne(() => Post, { nullable: true })
  @JoinColumn({ name: 'related_post_id' })
  relatedPost: Post | null;
}