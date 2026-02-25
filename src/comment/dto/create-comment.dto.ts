import { IsString, IsUUID, IsOptional, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsUUID()
  postId: string;

  @IsString()
  @MaxLength(500, { message: '评论不超过500字' })
  content: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsUUID()
  replyToUserId?: string;
}