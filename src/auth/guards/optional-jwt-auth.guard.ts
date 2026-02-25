import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  /**
   * 覆写 canActivate：无论 Token 是否存在都放行
   * 有 Token → 解析并挂载 req.user
   * 无 Token → req.user = undefined，继续执行
   */
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  /**
   * 覆写 handleRequest：不抛异常
   */
  handleRequest(err: any, user: any) {
    // 如果没有 Token 或 Token 无效，user 为 false，不抛错
    return user || null;
  }
}