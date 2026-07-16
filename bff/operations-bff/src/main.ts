import { NestFactory } from '@nestjs/core';
import { OperationsBffModule } from './operations-bff.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(OperationsBffModule);
  app.setGlobalPrefix('v1');
  app.enableShutdownHooks();
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3202);
  await app.listen(port);
  console.log(`operations-bff ouvindo em http://localhost:${port}/v1/health`);
}

bootstrap();