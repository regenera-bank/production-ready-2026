import { HealthController } from './health.controller';

describe('HealthController integrations', () => {
  let saved: NodeJS.ProcessEnv;

  beforeEach(() => {
    saved = { ...process.env };
  });

  afterEach(() => {
    process.env = saved;
  });

  it('homolog não reporta datavalid/pep como integrações reais nem productionReady', () => {
    process.env.KYC_PROVIDER = 'homolog';
    process.env.FIREBASE_PROJECT_ID = 'proj';
    process.env.GEMINI_API_KEY = 'key';
    process.env.GOOGLE_VISION_API_KEY = 'vision';
    process.env.WEBAUTHN_RP_ID = 'localhost';
    process.env.WEB_ORIGIN = 'http://localhost:5173';

    const result = new HealthController().integrations();

    expect(result.integrations.kycHomolog).toBe(true);
    expect(result.integrations.datavalid).toBe(false);
    expect(result.integrations.pep).toBe(false);
    expect(result.integrations.prometeo).toBe(false);
    expect(result.productionReady).toBe(false);
    expect(result.kycProvider).toBe('homolog');
  });

  it('firebase homolog marca productionReady=false', () => {
    process.env.KYC_PROVIDER = 'firebase';
    process.env.FIREBASE_PROJECT_ID = 'proj';
    process.env.GEMINI_API_KEY = 'key';
    process.env.GOOGLE_VISION_API_KEY = 'vision';
    process.env.WEBAUTHN_RP_ID = 'localhost';
    process.env.WEB_ORIGIN = 'http://localhost:5173';

    const result = new HealthController().integrations();

    expect(result.integrations.kycHomolog).toBe(true);
    expect(result.productionReady).toBe(false);
    expect(result.kycProvider).toBe('firebase');
  });

  it('prometeo com integrações reais pode ser productionReady', () => {
    process.env.KYC_PROVIDER = 'prometeo';
    process.env.PROMETEO_API_KEY = 'pk';
    process.env.FIREBASE_PROJECT_ID = 'proj';
    process.env.GEMINI_API_KEY = 'key';
    process.env.GOOGLE_VISION_API_KEY = 'vision';
    process.env.WEBAUTHN_RP_ID = 'regenera.bank';
    process.env.WEB_ORIGIN = 'https://app.regenera.bank';
    process.env.PROMETEO_WEBHOOK_VERIFY_TOKEN = 'wh';
    process.env.PROMETEO_WIDGET_ID = 'widget';

    const result = new HealthController().integrations();

    expect(result.integrations.kycHomolog).toBe(false);
    expect(result.integrations.datavalid).toBe(true);
    expect(result.integrations.pep).toBe(true);
    expect(result.productionReady).toBe(true);
    expect(result.ready).toBe(true);
  });
});