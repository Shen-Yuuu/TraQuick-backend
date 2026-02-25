import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryMessageDto extends PaginationDto {
  @IsOptional()
  @IsEnum(['like', 'comment', 'follow', 'system', 'capsule', 'bottle'])
  type?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRead?: boolean;
}