export enum ReconciliationCaseStatus {
  OPEN = 'OPEN',
  SETTLED = 'SETTLED',
  REJECTED = 'REJECTED',
}

export enum ReconciliationResolution {
  SETTLED = 'SETTLED',
  REJECTED = 'REJECTED',
}

export interface ReconciliationCaseRecord {
  id: string;
  paymentId: string;
  status: ReconciliationCaseStatus;
  evidenceRef: string;
  makerId: string;
  checkerId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface ResolveReconciliationCommand {
  paymentId: string;
  resolution: ReconciliationResolution;
  evidenceRef: string;
  makerId: string;
  checkerId: string;
}