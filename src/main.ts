import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter());

  // 全局响应格式包装
  app.useGlobalInterceptors(new TransformInterceptor());

  // 全局 DTO 校验
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  await app.listen(3000);
  console.log('🚀 TraQuick API 运行在 http://localhost:3000');
}
bootstrap();