import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { PostCollect } from './entities/post-collect.entity';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { UserModule } from '../user/user.module';
import { MessageModule } from '../message/message.module';
import { City } from '../city/entities/city.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostLike, PostCollect,City]),
    UserModule,
    forwardRef(() => MessageModule),
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}