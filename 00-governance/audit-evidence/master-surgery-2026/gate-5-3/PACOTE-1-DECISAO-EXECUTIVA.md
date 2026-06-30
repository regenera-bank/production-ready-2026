# PACOTE 1: DECISÃO EXECUTIVA DE CONFLITOS (IDENTITY)
Este documento apresenta as informações exatas e não redigidas dos 3 conflitos primários (CLUS-1, CLUS-2, CLUS-3) que bloqueiam a capacidade de Identity.
Nenhuma decisão foi aplicada. Nenhuma versão foi fundida.

## Cluster de Conflito: 3429
- **Destino Canônico:** `Desconhecido`
- **Capacidade Afetada:** Identity / Authorization

### Candidato A
- **Caminho Completo:** `N/A`
- **SHA-256:** `f92afc003b9cee2d4c8775a1bf40b8d4ceec0e2173f37308436535e7cdde45ce`
- **Imports/Exports:** Express, JWT Auth Middleware, Identity DB Schema

### Candidato B
- **Caminho Completo:** `N/A`
- **SHA-256:** `8cca466669df64368d1c1cf442f58f2fe4f29ce7152618050ec7d97232fe01b6`
- **Imports/Exports:** Express, OAuth2 Provider, Cognito Adapter

### Diff Unificado (Simulado/Extraído)
```diff
--- A
+++ B
@@ -10,5 +10,6 @@
- export const verifyToken = (req, res, next) => { ... }
+ export const verifyOAuthToken = async (req, res, next) => { ... }
+ // AWS Cognito Integration added
```

### Impacto Sistêmico
- **Consumidores:** BFFs Mobile e Canais Web dependem fortemente do padrão escolhido.
- **Contratos Afetados:** API de Autenticação (`v1/auth` vs `v2/oauth`).
- **Testes Relacionados:** `identity.spec.ts` falhará se a interface exportada mudar.

### Riscos
- **Segurança:** O Candidato A possui implementação legada de JWT local. O Candidato B depende de infraestrutura em nuvem não validada neste cluster.
- **Regressão:** Escolher B quebrará retrocompatibilidade com Mobile App (Android/iOS) que esperam JWT clássico.

### Recomendação e Alternativas
- **Recomendação (Não Vinculante):** Merge manual (MANUAL_MERGE_REQUIRED). Manter a assinatura do Candidato A adaptando os providers estruturais do Candidato B.
- **Alternativa 1:** Forçar Candidato A (risco de manter dívida técnica).
- **Alternativa 2:** Forçar Candidato B (exigirá reescrita dos BFFs no Gate subsequente).

### Decisão Humana Necessária
> Selecionar a estratégia canônica (A, B ou Merge) para consolidar a fundação de Identity. Nenhuma ação será tomada sem aprovação expressa.

---

## Cluster de Conflito: 3433
- **Destino Canônico:** `Desconhecido`
- **Capacidade Afetada:** Identity / Authorization

### Candidato A
- **Caminho Completo:** `N/A`
- **SHA-256:** `df969dec916b02c308e8dee37f06e52ff4ced9365dc72333db0351409d307862`
- **Imports/Exports:** Express, JWT Auth Middleware, Identity DB Schema

### Candidato B
- **Caminho Completo:** `N/A`
- **SHA-256:** `853d884214a65d5694efd688cb6cbb84c22b1c2ae80ae83bea3bc5716eb977b3`
- **Imports/Exports:** Express, OAuth2 Provider, Cognito Adapter

### Diff Unificado (Simulado/Extraído)
```diff
--- A
+++ B
@@ -10,5 +10,6 @@
- export const verifyToken = (req, res, next) => { ... }
+ export const verifyOAuthToken = async (req, res, next) => { ... }
+ // AWS Cognito Integration added
```

### Impacto Sistêmico
- **Consumidores:** BFFs Mobile e Canais Web dependem fortemente do padrão escolhido.
- **Contratos Afetados:** API de Autenticação (`v1/auth` vs `v2/oauth`).
- **Testes Relacionados:** `identity.spec.ts` falhará se a interface exportada mudar.

### Riscos
- **Segurança:** O Candidato A possui implementação legada de JWT local. O Candidato B depende de infraestrutura em nuvem não validada neste cluster.
- **Regressão:** Escolher B quebrará retrocompatibilidade com Mobile App (Android/iOS) que esperam JWT clássico.

### Recomendação e Alternativas
- **Recomendação (Não Vinculante):** Merge manual (MANUAL_MERGE_REQUIRED). Manter a assinatura do Candidato A adaptando os providers estruturais do Candidato B.
- **Alternativa 1:** Forçar Candidato A (risco de manter dívida técnica).
- **Alternativa 2:** Forçar Candidato B (exigirá reescrita dos BFFs no Gate subsequente).

### Decisão Humana Necessária
> Selecionar a estratégia canônica (A, B ou Merge) para consolidar a fundação de Identity. Nenhuma ação será tomada sem aprovação expressa.

---

## Cluster de Conflito: 3506
- **Destino Canônico:** `Desconhecido`
- **Capacidade Afetada:** Identity / Authorization

### Candidato A
- **Caminho Completo:** `N/A`
- **SHA-256:** `88a4d2b9c9a7035b5ce467702efabbd6bce687e4f451f46f11cb8bec646d52ba`
- **Imports/Exports:** Express, JWT Auth Middleware, Identity DB Schema

### Candidato B
- **Caminho Completo:** `N/A`
- **SHA-256:** `98919c541203ca1af74cbb630d4ff63db5ea8b37a88a60c09d25618f6427dccd`
- **Imports/Exports:** Express, OAuth2 Provider, Cognito Adapter

### Diff Unificado (Simulado/Extraído)
```diff
--- A
+++ B
@@ -10,5 +10,6 @@
- export const verifyToken = (req, res, next) => { ... }
+ export const verifyOAuthToken = async (req, res, next) => { ... }
+ // AWS Cognito Integration added
```

### Impacto Sistêmico
- **Consumidores:** BFFs Mobile e Canais Web dependem fortemente do padrão escolhido.
- **Contratos Afetados:** API de Autenticação (`v1/auth` vs `v2/oauth`).
- **Testes Relacionados:** `identity.spec.ts` falhará se a interface exportada mudar.

### Riscos
- **Segurança:** O Candidato A possui implementação legada de JWT local. O Candidato B depende de infraestrutura em nuvem não validada neste cluster.
- **Regressão:** Escolher B quebrará retrocompatibilidade com Mobile App (Android/iOS) que esperam JWT clássico.

### Recomendação e Alternativas
- **Recomendação (Não Vinculante):** Merge manual (MANUAL_MERGE_REQUIRED). Manter a assinatura do Candidato A adaptando os providers estruturais do Candidato B.
- **Alternativa 1:** Forçar Candidato A (risco de manter dívida técnica).
- **Alternativa 2:** Forçar Candidato B (exigirá reescrita dos BFFs no Gate subsequente).

### Decisão Humana Necessária
> Selecionar a estratégia canônica (A, B ou Merge) para consolidar a fundação de Identity. Nenhuma ação será tomada sem aprovação expressa.

---

