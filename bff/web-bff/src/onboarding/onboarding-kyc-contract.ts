export interface KycDocumentBody {
  documentContent?: string;
  fileBase64?: string;
  type?: 'RG' | 'CNH';
}

export interface KycSelfieBody {
  selfieContent?: string;
  selfieBase64?: string;
}

export const resolveDocumentContent = (body: KycDocumentBody): string =>
  (body.documentContent ?? body.fileBase64 ?? '').trim();

export const resolveSelfieContent = (body: KycSelfieBody): string =>
  (body.selfieContent ?? body.selfieBase64 ?? '').trim();