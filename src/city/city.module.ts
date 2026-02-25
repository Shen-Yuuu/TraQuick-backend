import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { City } from './entities/city.entity';
import { UserCity } from './entities/user-city.entity';
import { CityController } from './city.controller';
import { CityService } from './city.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([City, UserCity]),
    UserModule,
  ],
  controllers: [CityController],
  providers: [CityService],
  exports: [CityService],
})
export class CityModule {}