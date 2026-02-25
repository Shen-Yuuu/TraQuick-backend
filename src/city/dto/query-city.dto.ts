import { IsOptional, IsString } from 'class-validator';

export class QueryCityDto {
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}