import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';

@Entity('time_capsules')
export class TimeCapsule extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user: User;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', array: true, default: '{}' })
  images: string[];

  @Column({ name: 'target_date', type: 'timestamp' })
  targetDate: Date;

  @Column({ name: 'city_name', type: 'varchar',nullable: true })
  cityName: string | null;

  @Column({type: 'varchar', nullable: true })
  address: string | null;

  @Column({
    type: 'enum',
    enum: ['locked', 'unlocked'],
    default: 'locked',
  })
  status: 'locked' | 'unlocked';
}