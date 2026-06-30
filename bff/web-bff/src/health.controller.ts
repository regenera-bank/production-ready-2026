import { Controller, Get } from '@nestjs/common';
import { AiService } from './ai/ai.service';
import { isHomologKycProvider, normalizeKycProvider } from './config/kyc-provider';

const configured = (value: string | undefined): boolean =>
  Boolean(value?.trim());

@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string; layer: string } {
    return { status: 'ok', layer: 'web-bff' };
  }

  @Get('integrations')
  integrations(): {
    readonly status: 'ok';
    readonly integrations: Record<string, boolean>;
    readonly ready: boolean;
    readonly productionReady: boolean;
    readonly kycProvider: string;
    readonly prometeoIdentityUrl: string;
    readonly prometeoBankingUrl: string;
    readonly paymentWebhookPath: string;
    readonly paymentIntentPath: string;
    readonly paymentsApiUrl: string;
    readonly widgetSdkVersion: string;
  } {
    const kycProvider = normalizeKycProvider();
    const homologKyc = isHomologKycProvider(kycProvider);

    const prometeo = configured(process.env.PROMETEO_API_KEY);
    const datavalidDedicated =
      configured(process.env.DATAVALID_API_URL) &&
      configured(process.env.DATAVALID_API_KEY);
    const pepDedicated =
      configured(process.env.PEP_API_URL) && configured(process.env.PEP_API_KEY);

    const firebase = configured(process.env.FIREBASE_PROJECT_ID);

    const gemini = AiService.isGeminiConfigured();

    const visionAdc =
      process.env.VISION_USE_ADC?.trim().toLowerCase() === 'true' &&
      Boolean(
        process.env.GOOGLE_VISION_PROJECT_ID?.trim() ||
          process.env.GEMINI_GCP_PROJECT_ID?.trim(),
      );
    const vision =
      visionAdc || configured(process.env.GOOGLE_VISION_API_KEY);

    const integrations = {
      firebase,
      gemini,
      prometeo,
      datavalid: datavalidDedicated || prometeo,
      vision,
      pep: pepDedicated || prometeo,
      webauthn:
        configured(process.env.WEBAUTHN_RP_ID) &&
        configured(process.env.WEB_ORIGIN),
      prometeoWebhook: configured(process.env.PROMETEO_WEBHOOK_VERIFY_TOKEN),
      prometeoWidget: configured(process.env.PROMETEO_WIDGET_ID),
      kycHomolog: homologKyc,
    };

    const homologOperationalKeys = [
      'firebase',
      'gemini',
      'vision',
      'webauthn',
    ] as const;
    const productionKeys = Object.keys(integrations).filter(
      (key) => !['prometeoWebhook', 'prometeoWidget', 'kycHomolog'].includes(key),
    ) as Array<keyof typeof integrations>;

    const homologOperational = homologOperationalKeys.every(
      (key) => integrations[key] === true,
    );
    const productionIntegrationsReady = productionKeys.every(
      (key) => integrations[key] === true,
    );

    const ready = homologKyc ? homologOperational : productionIntegrationsReady;
    const productionReady = !homologKyc && productionIntegrationsReady;

    return {
      status: 'ok',
      integrations,
      ready,
      productionReady,
      kycProvider,
      prometeoIdentityUrl:
        process.env.PROMETEO_IDENTITY_BASE_URL?.trim() ||
        'https://identity.sandbox.prometeoapi.com',
      prometeoBankingUrl:
        process.env.PROMETEO_BASE_URL?.trim() ||
        'https://banking.sandbox.prometeoapi.com',
      paymentWebhookPath: '/v1/prometeo/payments/webhook',
      paymentIntentPath: '/v1/prometeo/payments/intent',
      paymentsApiUrl:
        process.env.PROMETEO_PAYMENTS_BASE_URL?.trim() ||
        'https://payment.prometeoapi.net',
      widgetSdkVersion: '2.0.0',
    };
  }
}