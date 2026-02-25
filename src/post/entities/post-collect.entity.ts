import {
  Entity,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Post } from './post.entity';

@Entity('post_collects')
@Unique(['user', 'post'])
export class PostCollect {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user: User;

  @ManyToOne(() => Post, (post) => post.collects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  @Index()
  post: Post;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}