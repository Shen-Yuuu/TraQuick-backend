import { IsOptional, IsUUID, IsString, IsEnum } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryPostDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsEnum(['latest', 'hot'])
  orderBy?: 'latest' | 'hot' = 'latest';
}