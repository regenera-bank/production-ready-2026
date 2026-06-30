import { join } from 'path';
import { scanFloatViolations } from './float-guard';

describe('Float guard (PR-15)', () => {
  const srcRoot = join(__dirname, '..');

  it('não encontra float em caminhos monetários do src/', () => {
    const violations = scanFloatViolations(srcRoot);
    expect(violations).toEqual([]);
  });
});