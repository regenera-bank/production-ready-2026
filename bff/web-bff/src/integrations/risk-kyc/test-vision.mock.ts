import type { VisionAdapter } from './vision.adapter';

export const largeTestImageBase64 = (fillByte = 0xab): string => {
  const payload = Buffer.alloc(12_000, fillByte);
  return `data:image/png;base64,${payload.toString('base64')}`;
};

export const createTestVisionAdapter = (): VisionAdapter => ({
  extractText: async () => ({
    fullText: 'REPÚBLICA FEDERATIVA CARTEIRA IDENTIDADE',
    confidence: 0.92,
  }),
  detectFaces: async () => ({
    count: 1,
    largestFaceAreaRatio: 0.15,
  }),
  detectLabels: async () => ['Identity document', 'Paper'],
});