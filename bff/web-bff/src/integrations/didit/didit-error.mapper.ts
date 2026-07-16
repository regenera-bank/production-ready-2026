import type {
  RegeneraDocumentFormat,
  RegeneraDocumentType,
  RegeneraKycDecision,
} from './didit.types';

/** Coaching canônico — fonte única no BFF; canal só renderiza. */
export interface DiditCoachingState {
  message: string | null;
  retryable: boolean;
  fatal: boolean;
}

const RETRYABLE = new Set([
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

const FATAL = new Set(['LIVENESS_FACE_ATTACK']);

const LABELS: Record<string, string> = {
  LOW_FACE_LUMINANCE: 'Ilumine o rosto de forma uniforme e tente novamente.',
  HIGH_FACE_LUMINANCE: 'Evite luz direta no rosto e tente novamente.',
  NO_FACE_DETECTED: 'Centralize o rosto na câmera e tente novamente.',
  LOW_FACE_QUALITY: 'Aproxime-se e mantenha o rosto nítido.',
  HIGH_FACE_OCCLUSION: 'Remova óculos, máscara ou chapéu e tente novamente.',
  LOW_LIVENESS_SCORE: 'Mantenha o rosto visível — a prova de vida não foi aceita.',
  MULTIPLE_FACES_DETECTED: 'Apenas uma pessoa deve aparecer na câmera.',
  AGE_NOT_DETECTED: 'Posicione o rosto de frente para a câmera.',
  LIVENESS_FACE_ATTACK: 'Tentativa de fraude detectada — verificação encerrada.',
  COULD_NOT_RECOGNIZE_DOCUMENT:
    'Documento não reconhecido — confira o tipo escolhido e envie foto nítida ou PDF oficial.',
  DOCUMENT_TYPE_NOT_ALLOWED:
    'Tipo de documento não confere — reinicie e escolha RG ou CNH de acordo com o arquivo.',
  DOCUMENT_NOT_SUPPORTED:
    'Arquivo não aceito — use JPG, PNG ou PDF oficial da CNH-e, sem screenshot da tela.',
  SCREEN_CAPTURE_DETECTED:
    'Parece captura de tela — use foto da carteira física ou PDF exportado do app CNH Digital.',
  PRINTED_COPY_DETECTED: 'Não envie foto de impressão — use o documento original ou PDF oficial.',
  IMAGE_TOO_BLURRY: 'Imagem borrada — aproxime, foque e tente de novo.',
  IMAGE_TOO_DARK: 'Imagem escura — melhore a iluminação.',
  IMAGE_TOO_BRIGHT: 'Imagem estourada — evite flash direto.',
  CAMERA_ACCESS_DENIED: 'Permita acesso à câmera para concluir a prova de vida.',
  NETWORK_ERROR: 'Falha de rede. Aguarde alguns segundos e tente novamente.',
};

const DECISION_MESSAGES: Partial<Record<RegeneraKycDecision, string>> = {
  MANUAL_REVIEW: 'Documento e selfie em análise — você pode fechar a tela; a decisão chega por webhook.',
  REJECTED: 'Verificação recusada — revise o documento ou escolha outro tipo.',
  ABANDONED: 'Verificação abandonada — reinicie e escolha RG ou CNH.',
  EXPIRED: 'Sessão expirada — inicie uma nova verificação.',
  PROVIDER_ERROR: 'Falha temporária no provedor — aguarde e use Sync.',
};

const DOCUMENT_HINTS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /carta de condu|driver/i,
    message:
      'Você escolheu CNH. CNH-e: envie o PDF completo exportado do app CDT/gov.br. CNH física: foto nítida da frente do cartão.',
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

export function flowInstructions(
  documentType: RegeneraDocumentType,
  documentFormat: RegeneraDocumentFormat,
): string[] {
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

export function coachingFromSdkEvent(data?: Record<string, unknown>): DiditCoachingState {
  if (!data) return { message: null, retryable: false, fatal: false };
  const codes = extractCodes(data);
  const code = codes[0];
  const fatal = codes.some((c) => FATAL.has(c));
  const retryable = codes.some((c) => RETRYABLE.has(c));
  if (code && LABELS[code]) {
    return { message: LABELS[code], retryable: retryable && !fatal, fatal };
  }
  const text = [data.message, data.detail, data.error]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .join(' ');
  if (text) {
    for (const hint of DOCUMENT_HINTS) {
      if (hint.pattern.test(text)) {
        return { message: hint.message, retryable: true, fatal: false };
      }
    }
    return { message: text, retryable, fatal };
  }
  return { message: null, retryable: false, fatal };
}

export function coachingFromBffRecord(input: {
  diditDecision?: RegeneraKycDecision;
  diditKycWarnings?: string[];
  kycReason?: string;
  diditDocumentType?: RegeneraDocumentType;
}): DiditCoachingState {
  for (const warning of input.diditKycWarnings ?? []) {
    const upper = warning.toUpperCase();
    for (const code of RETRYABLE) {
      if (upper.includes(code) && LABELS[code]) {
        return { message: LABELS[code], retryable: true, fatal: false };
      }
    }
    for (const hint of DOCUMENT_HINTS) {
      if (hint.pattern.test(warning)) {
        return { message: hint.message, retryable: true, fatal: false };
      }
    }
  }

  if (input.diditDecision && DECISION_MESSAGES[input.diditDecision]) {
    const fatal = input.diditDecision === 'REJECTED';
    return {
      message: DECISION_MESSAGES[input.diditDecision] ?? null,
      retryable: input.diditDecision === 'ABANDONED' || input.diditDecision === 'EXPIRED',
      fatal,
    };
  }

  if (input.kycReason?.startsWith('DIDIT_')) {
    return {
      message: DECISION_MESSAGES.REJECTED ?? 'Verificação Didit requer ação.',
      retryable: input.kycReason.includes('ABANDONED') || input.kycReason.includes('EXPIRED'),
      fatal: input.kycReason.includes('REJECTED'),
    };
  }

  return { message: null, retryable: false, fatal: false };
}

function extractCodes(data: Record<string, unknown>): string[] {
  const codes = Array.isArray(data.feedback_codes)
    ? data.feedback_codes.filter((c): c is string => typeof c === 'string')
    : [];
  const error = typeof data.error === 'string' ? [data.error] : [];
  return [...codes, ...error].map((c) => c.toUpperCase());
}