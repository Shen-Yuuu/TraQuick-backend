import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// JWT Payload 类型
export interface JwtPayload {
  sub: string;      // userId
  email: string;
}

// 登录/注册返回的数据结构
export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    nickname: string;
    avatar: string;
    level: number;
    levelTitle: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 注册
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, nickname } = registerDto;

    // 创建用户（UserService 内部处理邮箱冲突检查 + 密码加密）
    const user = await this.userService.create(email, password, nickname);

    // 生成 JWT
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        level: user.level,
        levelTitle: user.levelTitle,
      },
    };
  }

  /**
   * 登录
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // 查找用户（包含密码字段）
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 验证密码
    const isPasswordValid = await this.userService.validatePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 生成 JWT
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        level: user.level,
        levelTitle: user.levelTitle,
      },
    };
  }
}