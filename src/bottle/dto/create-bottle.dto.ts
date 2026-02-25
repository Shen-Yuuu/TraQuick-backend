import { IsString, IsEnum, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateBottleDto {
  @IsString()
  @MaxLength(1000, { message: '内容不超过1000字' })
  content: string;

  @IsEnum(['wish', 'story', 'question'])
  type: 'wish' | 'story' | 'question';

  @IsOptional()
  @IsUUID()
  cityId?: string;
}