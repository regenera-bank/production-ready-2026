import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { GoogleAuth } from 'google-auth-library';

export interface VisionTextResult {
  readonly fullText: string;
  readonly confidence: number;
}

export interface VisionFaceResult {
  readonly count: number;
  readonly largestFaceAreaRatio: number;
}

export interface VisionAdapter {
  extractText(buffer: Buffer): Promise<VisionTextResult>;
  detectFaces(buffer: Buffer): Promise<VisionFaceResult>;
  detectLabels(buffer: Buffer): Promise<readonly string[]>;
}

interface VisionFaceAnnotation {
  boundingPoly?: {
    vertices?: Array<{ x?: number; y?: number }>;
  };
}

interface VisionLabelAnnotation {
  description?: string;
  score?: number;
}

interface VisionAnnotateResponse {
  responses?: Array<{
    fullTextAnnotation?: { text?: string };
    textAnnotations?: Array<{ description?: string }>;
    faceAnnotations?: VisionFaceAnnotation[];
    labelAnnotations?: VisionLabelAnnotation[];
    error?: { message?: string };
  }>;
}

const visionUsesAdc = (): boolean =>
  process.env.VISION_USE_ADC?.trim().toLowerCase() === 'true';

const resolveVisionProject = (): string | undefined =>
  process.env.GOOGLE_VISION_PROJECT_ID?.trim() ||
  process.env.GEMINI_GCP_PROJECT_ID?.trim() ||
  process.env.GOOGLE_CLOUD_PROJECT?.trim();

@Injectable()
export class GcpVisionAdapter implements VisionAdapter {
  private adcAuth: GoogleAuth | null = null;

  private async accessToken(): Promise<string> {
    if (!this.adcAuth) {
      this.adcAuth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    }
    const client = await this.adcAuth.getClient();
    const token = await client.getAccessToken();
    if (!token.token) {
      throw new ServiceUnavailableException(
        'ADC sem token — rode: gcloud auth application-default login',
      );
    }
    return token.token;
  }

  private buildAnnotateUrl(): string {
    if (visionUsesAdc()) {
      const project = resolveVisionProject();
      if (!project) {
        throw new ServiceUnavailableException(
          'GOOGLE_VISION_PROJECT_ID ou GEMINI_GCP_PROJECT_ID obrigatório com VISION_USE_ADC=true',
        );
      }
      return `https://vision.googleapis.com/v1/projects/${project}/locations/global/images:annotate`;
    }
    const apiKey = process.env.GOOGLE_VISION_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'GOOGLE_VISION_API_KEY ou VISION_USE_ADC=true obrigatório para OCR',
      );
    }
    return `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`;
  }

  private async annotate(
    buffer: Buffer,
    features: Array<{ type: string; maxResults?: number }>,
  ): Promise<VisionAnnotateResponse['responses']> {
    if (buffer.length < 32) {
      return [{}];
    }

    const url = this.buildAnnotateUrl();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (visionUsesAdc()) {
      headers.Authorization = `Bearer ${await this.accessToken()}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        requests: [
          {
            image: { content: buffer.toString('base64') },
            features,
          },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new ServiceUnavailableException(
        `Google Vision falhou (${response.status}): ${detail.slice(0, 200)}`,
      );
    }

    const payload = (await response.json()) as VisionAnnotateResponse;
    const first = payload.responses?.[0];
    if (first?.error?.message) {
      throw new ServiceUnavailableException(
        `Google Vision: ${first.error.message}`,
      );
    }
    return payload.responses;
  }

  async extractText(buffer: Buffer): Promise<VisionTextResult> {
    const responses = await this.annotate(buffer, [
      { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
    ]);
    const first = responses?.[0];

    const fullText =
      first?.fullTextAnnotation?.text?.trim() ??
      first?.textAnnotations?.[0]?.description?.trim() ??
      '';

    if (!fullText) {
      return { fullText: '', confidence: 0 };
    }

    const hasOfficialKeywords =
      /(REPÚBLICA|FEDERATIVA|CARTEIRA|IDENTIDADE|NACIONAL|HABILITAÇÃO|CNH|RG)/i.test(
        fullText,
      );

    return {
      fullText,
      confidence: hasOfficialKeywords ? 0.92 : 0.55,
    };
  }

  async detectFaces(buffer: Buffer): Promise<VisionFaceResult> {
    const responses = await this.annotate(buffer, [
      { type: 'FACE_DETECTION', maxResults: 10 },
    ]);
    const faces = responses?.[0]?.faceAnnotations ?? [];
    if (faces.length === 0) {
      return { count: 0, largestFaceAreaRatio: 0 };
    }

    const allXs = faces.flatMap(
      (face) => face.boundingPoly?.vertices?.map((v) => v.x ?? 0) ?? [],
    );
    const allYs = faces.flatMap(
      (face) => face.boundingPoly?.vertices?.map((v) => v.y ?? 0) ?? [],
    );
    const imgW = Math.max(...allXs, 1);
    const imgH = Math.max(...allYs, 1);
    const imageArea = imgW * imgH;

    let largestRatio = 0;
    for (const face of faces) {
      const vertices = face.boundingPoly?.vertices ?? [];
      if (vertices.length < 2) continue;
      const xs = vertices.map((v) => v.x ?? 0);
      const ys = vertices.map((v) => v.y ?? 0);
      const width = Math.max(...xs) - Math.min(...xs);
      const height = Math.max(...ys) - Math.min(...ys);
      const area = Math.max(0, width * height);
      largestRatio = Math.max(largestRatio, area / imageArea);
    }

    return {
      count: faces.length,
      largestFaceAreaRatio: largestRatio,
    };
  }

  async detectLabels(buffer: Buffer): Promise<readonly string[]> {
    const responses = await this.annotate(buffer, [
      { type: 'LABEL_DETECTION', maxResults: 12 },
    ]);
    const labels = responses?.[0]?.labelAnnotations ?? [];
    return labels
      .filter((item) => (item.score ?? 0) >= 0.6)
      .map((item) => item.description?.trim() ?? '')
      .filter(Boolean);
  }
}