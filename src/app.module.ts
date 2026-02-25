import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Entities
import { User } from './user/entities/user.entity';
import { UserFollow } from './user/entities/user-follow.entity';
import { Post } from './post/entities/post.entity';
import { PostLike } from './post/entities/post-like.entity';
import { PostCollect } from './post/entities/post-collect.entity';
import { Comment } from './comment/entities/comment.entity';
import { City } from './city/entities/city.entity';
import { UserCity } from './city/entities/user-city.entity';
import { DriftBottle } from './bottle/entities/drift-bottle.entity';
import { TimeCapsule } from './capsule/entities/time-capsule.entity';
import { Message } from './message/entities/message.entity';

// Modules
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { CityModule } from './city/city.module';
import { BottleModule } from './bottle/bottle.module';
import { CapsuleModule } from './capsule/capsule.module';
import { MessageModule } from './message/message.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'root'),
        database: configService.get<string>('DB_DATABASE', 'traquick_db'),
        entities: [
          User, UserFollow,
          Post, PostLike, PostCollect,
          Comment,
          City, UserCity,
          DriftBottle,
          TimeCapsule,
          Message,
        ],
        synchronize: true,
      }),
    }),

    AuthModule,
    UserModule,
    PostModule,
    CommentModule,
    CityModule,
    BottleModule,
    CapsuleModule,
    MessageModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}