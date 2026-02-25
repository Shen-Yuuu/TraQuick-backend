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
import { City } from '../../city/entities/city.entity';
import { Comment } from '../../comment/entities/comment.entity';
import { PostLike } from './post-like.entity';
import { PostCollect } from './post-collect.entity';

@Entity('posts')
export class Post extends BaseEntity {
  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  @Index()
  author: User;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', array: true, default: '{}' })
  images: string[];

  @Column({type: 'varchar', nullable: true })
  video: string | null;

  @Column({ type: 'enum', enum: ['image', 'video'], default: 'image' })
  type: 'image' | 'video';

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  // ====== 位置信息（平铺） ======

  @ManyToOne(() => City, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'city_id' })
  @Index()
  city: City | null;

  @Column({type: 'varchar', nullable: true })
  address: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 11, scale: 6, nullable: true })
  longitude: number | null;

  // ====== 冗余计数 ======

  @Column({ name: 'like_count', default: 0 })
  likeCount: number;

  @Column({ name: 'comment_count', default: 0 })
  commentCount: number;

  @Column({ name: 'share_count', default: 0 })
  shareCount: number;

  @Column({ name: 'collect_count', default: 0 })
  collectCount: number;

  // ====== 关系 ======

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @OneToMany(() => PostLike, (like) => like.post)
  likes: PostLike[];

  @OneToMany(() => PostCollect, (collect) => collect.post)
  collects: PostCollect[];
}