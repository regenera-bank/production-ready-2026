export interface PepCheckResult {
  readonly isPep: boolean;
  readonly score: number;
}

export interface PepProvider {
  check(document: string): Promise<PepCheckResult>;
}