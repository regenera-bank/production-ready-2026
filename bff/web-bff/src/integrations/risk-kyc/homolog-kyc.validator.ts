import { Injectable, Inject } from '@nestjs/common';
import { createHash } from 'crypto';
import type { VisionAdapter } from './vision.adapter';

export interface HomologBiometricVerdict {
  readonly score: number;
  readonly match: boolean;
  readonly reason?: string;
}

const homologKycEnabled = (): boolean => {
  const provider = process.env.KYC_PROVIDER?.trim().toLowerCase();
  return provider === 'firebase' || provider === 'homolog';
};

const decodeBase64Image = (base64: string): Buffer => {
  const raw = base64.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(raw, 'base64');
};

const SCREEN_LABEL_HINTS =
  /(screenshot|screen|display|monitor|mobile phone|tablet computer|television|computer monitor)/i;

const SCREEN_TEXT_HINTS =
  /(instagram|whatsapp|facebook|tiktok|notificaç|barra de status|screenshot|print da tela|regenera bank|pix copia)/i;

@Injectable()
export class HomologKycValidator {
  constructor(
    @Inject('VISION_ADAPTER') private readonly vision: VisionAdapter,
  ) {}

  isHomologMode(): boolean {
    return homologKycEnabled();
  }

  async verifyDocument(buffer: Buffer): Promise<{
    readonly ok: boolean;
    readonly reason?: string;
  }> {
    if (buffer.length < 8_192) {
      return { ok: false, reason: 'DOCUMENT_IMAGE_TOO_SMALL' };
    }

    const { fullText, confidence } = await this.vision.extractText(buffer);
    const text = fullText.trim();
    if (text.length < 24) {
      return { ok: false, reason: 'DOCUMENT_TEXT_INSUFFICIENT' };
    }
    if (SCREEN_TEXT_HINTS.test(text)) {
      return { ok: false, reason: 'DOCUMENT_SCREEN_CAPTURE' };
    }
    const hasOfficialKeywords =
      /(REPÚBLICA|FEDERATIVA|CARTEIRA|IDENTIDADE|NACIONAL|HABILITAÇÃO|CNH|REGISTRO|MINISTÉRIO)/i.test(
        text,
      );
    if (!hasOfficialKeywords) {
      return { ok: false, reason: 'DOCUMENT_NOT_OFFICIAL' };
    }
    if (confidence < 0.85) {
      return { ok: false, reason: 'DOCUMENT_LOW_CONFIDENCE' };
    }

    const faces = await this.vision.detectFaces(buffer);
    if (faces.count < 1) {
      return { ok: false, reason: 'DOCUMENT_FACE_MISSING' };
    }

    const labels = await this.vision.detectLabels(buffer);
    if (labels.some((label) => SCREEN_LABEL_HINTS.test(label))) {
      return { ok: false, reason: 'DOCUMENT_SCREEN_CAPTURE' };
    }

    return { ok: true };
  }

  async matchFacialBiometrics(data: {
    selfie: string;
    document: string;
  }): Promise<HomologBiometricVerdict> {
    const selfieBuf = decodeBase64Image(data.selfie);
    const docBuf = decodeBase64Image(data.document);

    if (selfieBuf.length < 8_192 || docBuf.length < 8_192) {
      return { score: 0, match: false, reason: 'BIOMETRY_IMAGE_TOO_SMALL' };
    }

    const selfieHash = createHash('sha256').update(selfieBuf).digest('hex');
    const docHash = createHash('sha256').update(docBuf).digest('hex');
    if (selfieHash === docHash) {
      return { score: 0, match: false, reason: 'SELFIE_SAME_AS_DOCUMENT' };
    }

    const selfieFaces = await this.vision.detectFaces(selfieBuf);
    if (selfieFaces.count !== 1) {
      return {
        score: 0,
        match: false,
        reason:
          selfieFaces.count === 0
            ? 'SELFIE_FACE_MISSING'
            : 'SELFIE_MULTIPLE_FACES',
      };
    }
    if (selfieFaces.largestFaceAreaRatio < 0.08) {
      return { score: 0, match: false, reason: 'SELFIE_FACE_TOO_SMALL' };
    }

    const docFaces = await this.vision.detectFaces(docBuf);
    if (docFaces.count < 1) {
      return { score: 0, match: false, reason: 'DOCUMENT_FACE_MISSING' };
    }

    const selfieLabels = await this.vision.detectLabels(selfieBuf);
    if (selfieLabels.some((label) => SCREEN_LABEL_HINTS.test(label))) {
      return { score: 0, match: false, reason: 'SELFIE_SCREEN_CAPTURE' };
    }

    const selfieText = await this.vision.extractText(selfieBuf);
    if (SCREEN_TEXT_HINTS.test(selfieText.fullText)) {
      return { score: 0, match: false, reason: 'SELFIE_SCREEN_CAPTURE' };
    }

    const score = Math.min(
      0.94,
      0.72 +
        selfieFaces.largestFaceAreaRatio * 0.5 +
        Math.min(docFaces.largestFaceAreaRatio, 0.15),
    );

    return {
      score,
      match: score >= 0.85,
      reason: score >= 0.85 ? undefined : 'LOW_SIMILARITY_SCORE',
    };
  }
}