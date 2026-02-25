import {
  Entity,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserCity } from './user-city.entity';

@Entity('cities')
export class City extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  @Index()
  name: string;

  @Column({ name: 'name_en', type: 'varchar', length: 100, nullable: true })
  nameEn: string | null;

  @Column({ type: 'varchar', length: 100 })
  country: string;

  @Column({ name: 'country_code', type: 'varchar', length: 4 })
  countryCode: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  province: string | null;

  @Column({ name: 'cover_image', type: 'varchar', default: '' })
  coverImage: string;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 6 })
  longitude: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'posts_count', type: 'int', default: 0 })
  postsCount: number;

  @Column({ name: 'visitors_count', type: 'int', default: 0 })
  visitorsCount: number;

  @OneToMany(() => UserCity, (uc) => uc.city)
  visitors: UserCity[];
}