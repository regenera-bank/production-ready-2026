import { CANARY_TRAFFIC_PERCENT } from './canary-gate.config';
import { CanaryRouter } from './canary-router';

describe('CanaryRouter (PR-15)', () => {
  const router = new CanaryRouter();

  it('roteia ~1% das chaves estáveis para canário', () => {
    const keys = Array.from({ length: 10_000 }, (_, i) => `corr-${i}`);
    const rate = router.sampleRate(keys);
    expect(rate).toBeGreaterThan(0.005);
    expect(rate).toBeLessThan(0.02);
  });

  it('decisão é determinística para a mesma chave', () => {
    const first = router.decide('stable-key-abc');
    const second = router.decide('stable-key-abc');
    expect(second).toEqual(first);
  });

  it('expõe percentual configurado', () => {
    expect(router.decide('any-key').trafficPercent).toBe(CANARY_TRAFFIC_PERCENT);
  });
});