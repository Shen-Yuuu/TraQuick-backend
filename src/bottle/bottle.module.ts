import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriftBottle } from './entities/drift-bottle.entity';
import { BottleController } from './bottle.controller';
import { BottleService } from './bottle.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DriftBottle]),
    UserModule,
  ],
  controllers: [BottleController],
  providers: [BottleService],
  exports: [BottleService],
})
export class BottleModule {}