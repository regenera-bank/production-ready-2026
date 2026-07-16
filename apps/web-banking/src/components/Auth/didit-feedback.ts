export type DocumentType = 'RG' | 'CNH';
export type DocumentFormat = 'physical' | 'digital';

export const STEP_LABELS: Record<string, string> = {
  document_selection: 'Confirme o documento escolhido',
  document_front: 'Envie a frente do documento',
  document_back: 'Envie o verso do documento',
  face: 'Selfie — prova de vida',
  email: 'Confirmação de e-mail',
  phone: 'Confirmação de telefone',
  poa: 'Comprovante de endereço',
  questionnaire: 'Questionário',
};

const RETRYABLE_FEEDBACK = new Set([
  'LOW_FACE_LUMINANCE',
  'HIGH_FACE_LUMINANCE',
  'NO_FACE_DETECTED',
  'LOW_FACE_QUALITY',
  'HIGH_FACE_OCCLUSION',
  'LOW_LIVENESS_SCORE',
  'MULTIPLE_FACES_DETECTED',
  'AGE_NOT_DETECTED',
  'COULD_NOT_RECOGNIZE_DOCUMENT',
  'DOCUMENT_TYPE_NOT_ALLOWED',
  'DOCUMENT_NOT_SUPPORTED',
  'SCREEN_CAPTURE_DETECTED',
  'PRINTED_COPY_DETECTED',
  'IMAGE_TOO_BLURRY',
  'IMAGE_TOO_DARK',
  'IMAGE_TOO_BRIGHT',
  'NETWORK_ERROR',
  'CAMERA_ACCESS_DENIED',
]);

const FATAL_LIVENESS_ERRORS = new Set(['LIVENESS_FACE_ATTACK']);

const FEEDBACK_LABELS: Record<string, string> = {
  LOW_FACE_LUMINANCE: 'Ilumine o rosto de forma uniforme e tente novamente.',
  HIGH_FACE_LUMINANCE: 'Evite luz direta no rosto e tente novamente.',
  NO_FACE_DETECTED: 'Centralize o rosto na câmera e tente novamente.',
  LOW_FACE_QUALITY: 'Aproxime-se e mantenha o rosto nítido.',
  HIGH_FACE_OCCLUSION: 'Remova óculos, máscara ou chapéu e tente novamente.',
  LOW_LIVENESS_SCORE: 'Mantenha o rosto visível — a prova de vida não foi aceita.',
  MULTIPLE_FACES_DETECTED: 'Apenas uma pessoa deve aparecer na câmera.',
  AGE_NOT_DETECTED: 'Posicione o rosto de frente para a câmera.',
  LIVENESS_FACE_ATTACK: 'Tentativa de fraude detectada — verificação encerrada.',
  COULD_NOT_RECOGNIZE_DOCUMENT: 'Documento não reconhecido — confira o tipo escolhido e envie foto nítida ou PDF oficial.',
  DOCUMENT_TYPE_NOT_ALLOWED: 'Tipo de documento não confere — reinicie e escolha RG ou CNH de acordo com o arquivo.',
  DOCUMENT_NOT_SUPPORTED: 'Arquivo não aceito — use JPG, PNG ou PDF oficial da CNH-e, sem screenshot da tela.',
  SCREEN_CAPTURE_DETECTED: 'Parece captura de tela — use foto da carteira física ou PDF exportado do app CNH Digital.',
  PRINTED_COPY_DETECTED: 'Não envie foto de impressão — use o documento original ou PDF oficial.',
  IMAGE_TOO_BLURRY: 'Imagem borrada — aproxime, foque e tente de novo.',
  IMAGE_TOO_DARK: 'Imagem escura — melhore a iluminação.',
  IMAGE_TOO_BRIGHT: 'Imagem estourada — evite flash direto.',
  CAMERA_ACCESS_DENIED: 'Permita acesso à câmera para concluir a prova de vida.',
  NETWORK_ERROR: 'Falha de rede. Aguarde alguns segundos e tente novamente.',
};

const DOCUMENT_ERROR_HINTS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /carta de condu|driver/i,
    message:
      'Você escolheu CNH. CNH-e: envie o PDF completo exportado do app CDT/gov.br. CNH física: foto nítida da frente do cartão. Sem screenshot.',
  },
  {
    pattern: /documento não é suportado|documento nao e suportado|not supported/i,
    message: 'O arquivo não bate com o documento escolhido. Confira RG vs CNH e use foto nítida ou PDF oficial.',
  },
  {
    pattern: /carteira de identidade|identity card/i,
    message: 'Você escolheu RG. Envie frente e verso do RG — não envie CNH nem screenshot do celular.',
  },
];

export function flowInstructions(documentType: DocumentType, documentFormat: DocumentFormat): string[] {
  if (documentType === 'RG') {
    return ['1. Frente do RG — câmera ou upload', '2. Verso do RG', '3. Selfie ao vivo — prova de vida'];
  }

  if (documentFormat === 'digital') {
    return [
      '1. App Carteira Digital de Trânsito → Condutor → Habilitação → Exportar',
      '2. Salve o PDF oficial gerado pelo app',
      '3. Envie esse PDF inteiro, uma vez só',
      '4. Proibido: screenshot, foto da tela, imprimir e fotografar',
      '5. Selfie ao vivo — prova de vida',
    ];
  }

  return [
    '1. Foto nítida da frente da CNH física',
    '2. Não envie RG, print de tela nem foto do verso separado',
    '3. Selfie ao vivo — prova de vida',
  ];
}

export function resolveCoachingMessage(data?: Record<string, unknown>): string | null {
  if (!data) return null;
  const codes = getCodes(data);
  const code = codes[0];
  if (code && FEEDBACK_LABELS[code]) return FEEDBACK_LABELS[code];

  const text = [data.message, data.detail, data.error]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ');

  if (!text) return null;
  for (const hint of DOCUMENT_ERROR_HINTS) {
    if (hint.pattern.test(text)) return hint.message;
  }
  return text;
}

export function isRetryableFeedback(data?: Record<string, unknown>): boolean {
  if (!data) return false;
  if (getCodes(data).some((code) => RETRYABLE_FEEDBACK.has(code))) return true;
  const text = [data.detail, data.message, data.error]
    .filter((value): value is string => typeof value === 'string')
    .join(' ');
  return DOCUMENT_ERROR_HINTS.some((hint) => hint.pattern.test(text));
}

export function isFatalLivenessError(data?: Record<string, unknown>): boolean {
  if (!data) return false;
  return getCodes(data).some((code) => FATAL_LIVENESS_ERRORS.has(code));
}

export function formatStep(step: string | undefined, documentType: DocumentType | null): string {
  if (!step) return 'Preparando verificação...';
  if (step === 'document_front' && documentType === 'CNH') return 'CNH — envie o PDF completo da CNH-e ou foto da frente do cartão';
  if (step === 'document_back' && documentType === 'CNH') return 'CNH — um único PDF com frente e verso; não envie arquivos separados';
  return STEP_LABELS[step] ?? step.replace(/_/g, ' ');
}

function getCodes(data: Record<string, unknown>): string[] {
  const codes = Array.isArray(data.feedback_codes)
    ? data.feedback_codes.filter((code): code is string => typeof code === 'string')
    : [];
  const error = typeof data.error === 'string' ? [data.error] : [];
  return [...codes, ...error].map((code) => code.toUpperCase());
}
