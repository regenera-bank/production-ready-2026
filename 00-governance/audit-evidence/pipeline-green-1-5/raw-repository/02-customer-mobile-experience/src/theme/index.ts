/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

export { colors } from './colors';

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
};

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, full: 9999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, color: '#e2e8f0' },
  h2: { fontSize: 22, fontWeight: '700' as const, color: '#e2e8f0' },
  h3: { fontSize: 16, fontWeight: '600' as const, color: '#e2e8f0' },
  body: { fontSize: 14, fontWeight: '400' as const, color: '#94a3b8' },
  caption: { fontSize: 12, fontWeight: '400' as const, color: '#475569' },
  label: { fontSize: 11, fontWeight: '600' as const, color: '#64748b', letterSpacing: 1 },
};
