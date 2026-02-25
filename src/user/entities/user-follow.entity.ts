import {
  Entity,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from './user.entity';

@Entity('user_follows')
@Unique(['follower', 'following'])
export class UserFollow extends BaseEntity {
  @ManyToOne(() => User, (user) => user.following, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  @Index()
  follower: User;

  @ManyToOne(() => User, (user) => user.followers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_id' })
  @Index()
  following: User;
}