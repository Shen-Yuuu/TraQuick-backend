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
import { City } from './city.entity';

@Entity('user_cities')
@Unique(['user', 'city'])
export class UserCity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.unlockedCities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user: User;

  @ManyToOne(() => City, (city) => city.visitors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'city_id' })
  @Index()
  city: City;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}