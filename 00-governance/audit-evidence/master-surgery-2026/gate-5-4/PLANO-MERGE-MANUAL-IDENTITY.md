# Plano de Merge Manual - Identity

## 1. Arquivos que serão criados
- `domains/identity/src/providers/IdentityProvider.ts` (Interface)
- `domains/identity/src/providers/LocalJwtProvider.ts` (Adapter A)
- `domains/identity/src/providers/CognitoProvider.ts` (Adapter B)

## 2. Arquivos que serão modificados
- O `verifyToken` middleware central para injetar o Provider dinâmico.

## 3. Símbolos Preservados
- A interface pública consumida pelo BFF: `verifyToken(req, res, next)`.

## 4. Símbolos Deprecados
- Chamadas diretas rígidas ao `jsonwebtoken.verify` no handler central.

## 5. Adapters Necessários
- `LocalJwtProvider` e `CognitoProvider` com factory/injeção por configuração.

## 6. Composição e Dependency Injection
- A composição será injetada via Env (`AUTH_PROVIDER=LOCAL|COGNITO`) na inicialização do server.

