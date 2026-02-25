import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeCapsule } from './entities/time-capsule.entity';
import { CapsuleController } from './capsule.controller';
import { CapsuleService } from './capsule.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TimeCapsule]),
    UserModule,
  ],
  controllers: [CapsuleController],
  providers: [CapsuleService],
  exports: [CapsuleService],
})
export class CapsuleModule {}