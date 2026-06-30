# Plano de Compatibilidade v1 -> v2

## 7. Contrato de Compatibilidade
- A versão `v1/auth` e os payloads decodificados no `req.user` permanecerão imutáveis para garantir a estabilidade do BFF.

## 8. Validações Core
- **Issuer/Audience/Algoritmo:** Validados centralmente no Abstract Provider.
- **Expiração:** Mapeamento unificado dos erros de `TokenExpiredError` (JWT) e expiração OAuth2 para o mesmo status HTTP 401.

