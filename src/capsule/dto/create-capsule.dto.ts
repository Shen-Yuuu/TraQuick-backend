import {
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class CreateCapsuleDto {
  @IsString()
  @MaxLength(2000, { message: '内容不超过2000字' })
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsDateString({}, { message: '请输入有效的日期' })
  targetDate: string;

  @IsOptional()
  @IsString()
  cityName?: string;

  @IsOptional()
  @IsString()
  address?: string;
}