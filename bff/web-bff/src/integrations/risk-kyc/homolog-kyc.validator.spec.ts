import { Test, TestingModule } from '@nestjs/testing';
import { HomologKycValidator } from './homolog-kyc.validator';
import type { VisionAdapter } from './vision.adapter';
import {
  createTestVisionAdapter,
  largeTestImageBase64,
} from './test-vision.mock';

const docBuffer = (): Buffer => Buffer.alloc(12_000, 0xab);

const buildModule = async (vision: VisionAdapter): Promise<HomologKycValidator> => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      HomologKycValidator,
      { provide: 'VISION_ADAPTER', useValue: vision },
    ],
  }).compile();
  return module.get(HomologKycValidator);
};

describe('HomologKycValidator (anti-fake)', () => {
  beforeEach(() => {
    process.env.KYC_PROVIDER = 'homolog';
  });

  it('aprova documento legítimo com mock Vision padrão', async () => {
    const validator = await buildModule(createTestVisionAdapter());
    await expect(validator.verifyDocument(docBuffer())).resolves.toEqual({
      ok: true,
    });
  });

  it('rejeita screenshot por texto OCR', async () => {
    const vision: VisionAdapter = {
      ...createTestVisionAdapter(),
      extractText: async () => ({
        fullText: 'screenshot whatsapp barra de status print da tela',
        confidence: 0.95,
      }),
    };
    const validator = await buildModule(vision);
    await expect(validator.verifyDocument(docBuffer())).resolves.toEqual({
      ok: false,
      reason: 'DOCUMENT_SCREEN_CAPTURE',
    });
  });

  it('rejeita screenshot por label Vision', async () => {
    const vision: VisionAdapter = {
      ...createTestVisionAdapter(),
      detectLabels: async () => ['screenshot', 'mobile phone'],
    };
    const validator = await buildModule(vision);
    await expect(validator.verifyDocument(docBuffer())).resolves.toEqual({
      ok: false,
      reason: 'DOCUMENT_SCREEN_CAPTURE',
    });
  });

  it('rejeita selfie com label de screenshot', async () => {
    const selfie = largeTestImageBase64(0xcd);
    const document = largeTestImageBase64(0xab);
    const vision: VisionAdapter = {
      extractText: async (buf) => {
        const text =
          buf[0] === 0xcd
            ? { fullText: 'REPÚBLICA FEDERATIVA CARTEIRA', confidence: 0.92 }
            : { fullText: 'REPÚBLICA FEDERATIVA CARTEIRA IDENTIDADE', confidence: 0.92 };
        return text;
      },
      detectFaces: async () => ({ count: 1, largestFaceAreaRatio: 0.2 }),
      detectLabels: async (buf) =>
        buf[0] === 0xcd ? ['screenshot', 'display'] : ['Identity document'],
    };
    const validator = await buildModule(vision);
    const verdict = await validator.matchFacialBiometrics({ selfie, document });
    expect(verdict.match).toBe(false);
    expect(verdict.reason).toBe('SELFIE_SCREEN_CAPTURE');
  });
});