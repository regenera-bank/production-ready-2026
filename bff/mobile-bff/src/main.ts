import { NestFactory } from '@nestjs/core';
import { MobileBffModule } from './mobile-bff.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(MobileBffModule);
  app.setGlobalPrefix('v1');
  app.enableShutdownHooks();
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3201);
  await app.listen(port);
  console.log(`mobile-bff ouvindo em http://localhost:${port}/v1/health`);
}

bootstrap();