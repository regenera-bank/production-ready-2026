export interface PepCheckResult {
  isPep: boolean;
  score: number;
}

export interface PepProvider {
  check(document: string): Promise<PepCheckResult>;
}
