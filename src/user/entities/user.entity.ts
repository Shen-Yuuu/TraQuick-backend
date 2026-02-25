import {
  Entity,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Post } from '../../post/entities/post.entity';
import { Comment } from '../../comment/entities/comment.entity';
import { UserFollow } from './user-follow.entity';
import { UserCity } from '../../city/entities/user-city.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  @Index()
  email: string;

  @Column({ type: 'varchar', select: false }) // 查询时默认不返回密码
  password: string;

  @Column({ type: 'varchar', length: 50 })
  nickname: string;

  @Column({ type: 'varchar', default: '' })
  avatar: string;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ default: 1 })
  level: number;

  @Column({ name: 'level_title', type: 'varchar', default: '迷雾行者' })
  levelTitle: string;

  @Column({ name: 'following_count', default: 0 })
  followingCount: number;

  @Column({ name: 'followers_count', default: 0 })
  followersCount: number;

  @Column({ name: 'friends_count', default: 0 })
  friendsCount: number;

  @Column({ name: 'cities_count', default: 0 })
  citiesCount: number;

  @Column({ name: 'countries_count', default: 0 })
  countriesCount: number;

  @Column({ name: 'posts_count', default: 0 })
  postsCount: number;

  // ====== 关系 ======

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => UserFollow, (follow) => follow.follower)
  following: UserFollow[];

  @OneToMany(() => UserFollow, (follow) => follow.following)
  followers: UserFollow[];

  @OneToMany(() => UserCity, (uc) => uc.user)
  unlockedCities: UserCity[];
}