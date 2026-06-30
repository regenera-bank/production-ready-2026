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

  const app = await NestFactory.create(WebBffModule);
  app.setGlobalPrefix('v1');
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
    const { AiService } = await import('./ai/ai.service');
    const gemini = AiService.isGeminiConfigured();
    const geminiMode = AiService.useVertex()
      ? `Vertex (${AiService.resolveVertexProject()})`
      : 'API key';
    console.log(`Gemini (Raphaela): ${gemini ? `configurado (${geminiMode})` : 'ausente'}`);
    if (!gemini) {
      console.warn(
        '⚠ Gemini ausente — chat da Raphaela retornará 503. Configure GEMINI_USE_VERTEX ou GEMINI_API_KEY em bff/web-bff/.env',
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
        '⚠ Vision ausente — defina VISION_USE_ADC=true + GEMINI_GCP_PROJECT_ID',
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