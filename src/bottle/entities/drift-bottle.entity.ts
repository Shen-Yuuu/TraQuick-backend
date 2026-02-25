import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { City } from '../../city/entities/city.entity';

@Entity('drift_bottles')
export class DriftBottle extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  @Index()
  sender: User;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: ['wish', 'story', 'question'] })
  type: 'wish' | 'story' | 'question';

  @ManyToOne(() => City, { nullable: true })
  @JoinColumn({ name: 'city_id' })
  city: City | null;

  // 捡瓶者
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'picker_id' })
  @Index()
  picker: User | null;

  @Column({ name: 'picked_at', type: 'timestamp', nullable: true })
  pickedAt: Date | null;
}