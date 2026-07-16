import { execSync } from 'node:child_process';
import {
  assertProductionKycSafe,
  ProductionKycGuardError,
} from './config/production-kyc-guard';
import { loadLocalEnv } from './load-env';

loadLocalEnv();
try {
  assertProductionKycSafe();
} catch (error) {
  if (error instanceof ProductionKycGuardError) {
    console.error(`FATAL [${error.code}]: ${error.message}`);
    process.exit(1);
  }
  throw error;
}

async function releasePort(port: number): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  try {
    const out = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' }).trim();
    if (!out) {
      return;
    }
    for (const pid of out.split('\n')) {
      const id = Number(pid.trim());
      if (id && id !== process.pid) {
        try {
          process.kill(id, 'SIGTERM');
        } catch {
          /* processo já encerrou */
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  } catch {
    /* porta livre */
  }
}

async function bootstrap(): Promise<void> {
  const { NestFactory } = await import('@nestjs/core');
  const { WebBffModule } = await import('./web-bff.module');
  const { CoreBankingExceptionFilter } = await import(
    './common/core-banking-exception.filter'
  );

  const app = await NestFactory.create(WebBffModule, { rawBody: true });
  app.setGlobalPrefix('v1');
  // B20 — headers de segurança. CSP libera apenas o iframe embarcado da Didit
  // (verify.didit.me) e conexões ao próprio BFF; nada de inline-eval.
  const isProd = process.env.NODE_ENV === 'production';
  const diditFrame = 'https://verify.didit.me https://*.didit.me';
  app.use((_req: unknown, res: { setHeader(k: string, v: string): void }, next: () => void) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(self "https://verify.didit.me"), microphone=(self "https://verify.didit.me"), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "img-src 'self' data: blob:",
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self'",
        `frame-src ${diditFrame}`,
        `connect-src 'self' ${diditFrame} https://identity.sandbox.prometeoapi.com`,
        "frame-ancestors 'none'",
      ].join('; '),
    );
    if (isProd) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    next();
  });
  // Erros de negócio do core-bank (400/404/409/422) chegam ao canal com o
  // corpo canônico em vez de virarem 500 genérico.
  app.useGlobalFilters(new CoreBankingExceptionFilter());
  app.enableShutdownHooks();
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (
        !origin ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        origin === process.env.WEB_ORIGIN
      ) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  });
  const port = Number(process.env.PORT ?? 3200);
  await releasePort(port);
  try {
    await app.listen(port);
    const prometeo = Boolean(process.env.PROMETEO_API_KEY?.trim());
    const identityUrl =
      process.env.PROMETEO_IDENTITY_BASE_URL?.trim() ||
      'https://identity.sandbox.prometeoapi.com';
    console.log(`web-bff ouvindo em http://localhost:${port}/v1/health`);
    console.log(`Prometeo Identity: ${identityUrl}`);
    const { AssistantService } = await import('./assistant/assistant.service');
    const assistantOk = AssistantService.isAssistantConfigured();
    const assistantMode = AssistantService.useVertex()
      ? `Vertex (${AssistantService.resolveVertexProject()})`
      : 'API key';
    console.log(`assistant: ${assistantOk ? `configurado (${assistantMode})` : 'ausente'}`);
    if (!assistantOk) {
      console.warn(
        '⚠ assistant offline — chat da Raphaela retornará 503. Configure ASSISTANT_USE_VERTEX/GEMINI_USE_VERTEX ou ASSISTANT_API_KEY/GEMINI_API_KEY em bff/web-bff/.env',
      );
    }

    const kycProvider = process.env.KYC_PROVIDER?.trim().toLowerCase() ?? 'firebase';
    const visionAdc = process.env.VISION_USE_ADC?.trim().toLowerCase() === 'true';
    const visionOk =
      visionAdc ||
      Boolean(process.env.GOOGLE_VISION_API_KEY?.trim());
    console.log(`KYC provider: ${kycProvider}`);
    console.log(
      `Prometeo Identity: ${prometeo ? 'configurado' : 'ausente'} | Vision OCR: ${visionOk ? (visionAdc ? 'ADC' : 'API key') : 'ausente'} | ViaCEP: ativo`,
    );
    if (!prometeo && kycProvider === 'prometeo') {
      console.warn('⚠ KYC_PROVIDER=prometeo exige PROMETEO_API_KEY');
    }
    if (!visionOk && kycProvider === 'prometeo') {
      console.warn(
        '⚠ Vision ausente — defina VISION_USE_ADC=true + projeto GCP',
      );
    }
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    if (code === 'EADDRINUSE') {
      console.error(
        `porta ${port} ocupada — rode: npm run stop:dev (ou lsof -ti :${port} | xargs kill -9)`,
      );
    }
    throw error;
  }
}

bootstrap();