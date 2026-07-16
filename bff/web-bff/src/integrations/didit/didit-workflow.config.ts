/**
 * Workflow KYC Didit — config por sessão, não segredo.
 * Regenera Web KYC: RG (ID) + CNH (DL), câmera ou upload, selfie ACTIVE_3D, face match.
 */
export const DIDIT_KYC_WORKFLOW_ID = '8b17a0ef-ad38-4a5a-b599-9e093a1281d3';

/** Espelha o PATCH em scripts/didit-ensure-workflow.mjs */
export const DIDIT_KYC_OCR_CAPTURE_METHODS = ['CAMERA_SCAN', 'UPLOAD'] as const;

/** RG: frente + verso. CNH (DL): Didit fixa sides=1 para BRA — uma captura com foto/dados. */
export const DIDIT_KYC_BRA_DOCUMENTS = {
  ID: { enabled: 1, sides: 2 },
  DL: { enabled: 1, sides: 1 },
} as const;