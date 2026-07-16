import { Controller, Get, Optional, ServiceUnavailableException } from '@nestjs/common';
import {
  ChannelIdentityService,
  ChannelJourneyService,
} from '@regenera/channel-persistence';
import { AssistantService } from './assistant/assistant.service';
import { isHomologKycProvider, normalizeKycProvider } from './config/kyc-provider';
import { CoreBankService } from './integrations/core-bank';

const configured = (value: string | undefined): boolean =>
  Boolean(value?.trim());

@Controller('health')
export class HealthController {
  constructor(
    private readonly core: CoreBankService,
    @Optional() private readonly identity?: ChannelIdentityService,
    @Optional() private readonly journey?: ChannelJourneyService,
  ) {}

  @Get()
  check(): { status: string; layer: string } {
    return { status: 'ok', layer: 'web-bff' };
  }

  @Get('ready')
  readiness(): {
    status: 'ready' | 'not_ready';
    layer: string;
    checks: Record<string, boolean>;
  } {
    const manifest = this.core?.getManifest();
    const persistenceReady = Boolean(manifest?.persistence);
    const modulesReady = (manifest?.modules.length ?? 0) >= 10;
    const channelPg =
      process.env.CHANNEL_PERSISTENCE?.trim().toLowerCase() === 'postgres';
    const channelBootstrapReady =
      !channelPg ||
      ((this.identity?.isPostgresReady() ?? false) &&
        (this.journey?.isPostgresReady() ?? false));
    // G67 — readiness profundo: provedor KYC ativo precisa estar configurado.
    const kycProvider = normalizeKycProvider();
    const kycReady =
      isHomologKycProvider(kycProvider) ||
      (kycProvider === 'didit'
        ? configured(process.env.DIDIT_API_KEY)
        : configured(process.env.PROMETEO_API_KEY));
    const checks = {
      coreBank: persistenceReady && modulesReady,
      persistence: persistenceReady,
      channelPersistence: channelBootstrapReady,
      kycProvider: kycReady,
    };
    const ready = Object.values(checks).every(Boolean);
    if (!ready) {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        layer: 'web-bff',
        checks,
      });
    }
    return { status: 'ready', layer: 'web-bff', checks };
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

    const assistantOk = AssistantService.isAssistantConfigured();

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
      assistant: assistantOk,
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
      didit:
        kycProvider === 'didit' && configured(process.env.DIDIT_API_KEY),
      diditWebhook: configured(process.env.DIDIT_WEBHOOK_SECRET),
    };

    const homologOperationalKeys = [
      'firebase',
      'assistant',
      'vision',
      'webauthn',
    ] as const;
    // didit/diditWebhook só são obrigatórias quando o provedor KYC é didit;
    // prometeo* só quando o provedor é prometeo. Nunca exigir integrações de
    // um provedor que não está ativo.
    const optionalByProvider: string[] = [
      'prometeoWebhook',
      'prometeoWidget',
      'kycHomolog',
      // Didit cobre ID + liveness + AML/PEP; não exigir stack Prometeo junto.
      ...(kycProvider === 'didit'
        ? ['prometeo', 'datavalid', 'pep']
        : ['didit', 'diditWebhook']),
    ];
    const productionKeys = Object.keys(integrations).filter(
      (key) => !optionalByProvider.includes(key),
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