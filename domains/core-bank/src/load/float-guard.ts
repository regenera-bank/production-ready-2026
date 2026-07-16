import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const MONEY_PATTERN = /amount|balance|money|cents|ledger|payment|hold|pix/i;
const FLOAT_PATTERN =
  /\b(parseFloat|toFixed|Number\.parseFloat)\s*\(|\bamount\s*:\s*\d+\.\d+/i;

export interface FloatViolation {
  readonly file: string;
  readonly line: number;
  readonly snippet: string;
}

const listSourceFiles = (rootDir: string): string[] => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        if (entry === 'node_modules' || entry === 'dist') {
          continue;
        }
        walk(fullPath);
        continue;
      }
      if (!fullPath.endsWith('.ts') || fullPath.endsWith('.spec.ts')) {
        continue;
      }
      files.push(fullPath);
    }
  };
  walk(rootDir);
  return files;
};

export const scanFloatViolations = (srcRoot: string): FloatViolation[] => {
  const violations: FloatViolation[] = [];
  for (const file of listSourceFiles(srcRoot)) {
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (!MONEY_PATTERN.test(line)) {
        return;
      }
      if (FLOAT_PATTERN.test(line)) {
        violations.push({
          file: relative(srcRoot, file),
          line: index + 1,
          snippet: line.trim(),
        });
      }
    });
  }
  return violations;
};