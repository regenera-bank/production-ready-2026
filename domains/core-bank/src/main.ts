import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export * from './public-api';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3100);
}

bootstrap();