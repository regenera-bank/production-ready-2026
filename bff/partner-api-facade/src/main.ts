import { NestFactory } from '@nestjs/core';
import { PartnerApiFacadeModule } from './partner-api-facade.module';
import { ProblemDetailsFilter } from './common/problem-details.filter';
import { RateLimitMiddleware } from './common/rate-limit.middleware';
import { MtlsMiddleware } from './common/mtls.middleware';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(PartnerApiFacadeModule);
  app.setGlobalPrefix('v1');
  app.enableCors({
    origin: [/^http:\/\/localhost:\d+$/, 'http://localhost:3400'],
    credentials: true,
  });
  app.useGlobalFilters(new ProblemDetailsFilter());
  app.use(new MtlsMiddleware().use.bind(new MtlsMiddleware()));
  app.use(new RateLimitMiddleware().use.bind(new RateLimitMiddleware()));
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3300);
  await app.listen(port);
  console.log(`partner-api-facade listening on http://localhost:${port}/v1/health`);
}

bootstrap();