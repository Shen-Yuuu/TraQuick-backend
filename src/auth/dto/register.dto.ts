import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @IsString()
  @MinLength(6, { message: '密码至少6位' })
  @MaxLength(30, { message: '密码不超过30位' })
  password: string;

  @IsString()
  @MinLength(1, { message: '昵称不能为空' })
  @MaxLength(50, { message: '昵称不超过50字' })
  nickname: string;
}