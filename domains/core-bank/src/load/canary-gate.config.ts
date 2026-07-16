export const DAILY_LOAD_TARGET = 50_000 as const;

export const CANARY_TRAFFIC_PERCENT = 1 as const;

export const LOAD_TEST_DEFAULT_OPS = 500 as const;

export const LOAD_SLO = {
  maxFailureRate: 0.01,
  maxP95LatencyMs: 500,
} as const;

export interface FeatureFlags {
  readonly CORE_PAYMENTS_ENABLED: boolean;
  readonly CORE_PIX_LIVE: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  CORE_PAYMENTS_ENABLED: false,
  CORE_PIX_LIVE: false,
};

export interface CanaryGateConfig {
  readonly dailyLoadTarget: number;
  readonly canaryTrafficPercent: number;
  readonly featureFlags: FeatureFlags;
  readonly invariantCount: number;
}

export const CANARY_GATE_CONFIG: CanaryGateConfig = {
  dailyLoadTarget: DAILY_LOAD_TARGET,
  canaryTrafficPercent: CANARY_TRAFFIC_PERCENT,
  featureFlags: DEFAULT_FEATURE_FLAGS,
  invariantCount: 47,
};