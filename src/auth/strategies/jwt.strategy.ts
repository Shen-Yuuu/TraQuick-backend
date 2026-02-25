import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * JWT 验证通过后，此方法的返回值会被注入到 req.user
   */
  async validate(payload: JwtPayload) {
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('用户不存在或已被删除');
    }
    // 返回的对象会挂载到 req.user
    return { sub: payload.sub, email: payload.email };
  }
}