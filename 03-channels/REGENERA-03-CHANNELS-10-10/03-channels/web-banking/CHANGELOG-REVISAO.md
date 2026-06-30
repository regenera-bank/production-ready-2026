# Changelog técnico — Vercel

**Classificação:** Bloqueado por lockfile/build e rotação de segredo.

Segredos distribuídos removidos; exemplo de ambiente e procedimento de migração adicionados; lockfile inconsistente retirado sem fabricar resolução de dependências.

## Alterações

### ADICIONADO — `.env.example`

- Motivo: Documentar variáveis sem material secreto.
- SHA-256 final: `074e40ef216f274258f02216da2f7686efbef9cd206f90092bf16934440f7997`

### ADICIONADO — `README.md`

- Motivo: Adicionar documentação operacional específica da revisão.
- SHA-256 final: `d32386f74ca930c42d3cf48e7b478cdb84d3c49f42381881627f33cca2ff2a59`

### ADICIONADO — `SECRETS-INVENTORY.md`

- Motivo: Adicionar documentação operacional específica da revisão.
- SHA-256 final: `34951febb09823d94ca1011dc0cc72cfd788daae83274c5a9d8bd43d5acd8558`

### ADICIONADO — `VALIDATION-EVIDENCE.md`

- Motivo: Adicionar documentação operacional específica da revisão.
- SHA-256 final: `123011bf4a9a79c9ef89615593a2226ac9bfdd7ff05148c7cb81a279e5070f40`

### ADICIONADO — `docs/LOCKFILE-INCIDENT.md`

- Motivo: Registrar causa, evidência e critério de desbloqueio do lockfile.
- SHA-256 final: `8277930dda81f381c784c81e296710ccd8f36fbc52a10de4e7424cee3b696a03`

### ADICIONADO — `docs/SECRET-MIGRATION.md`

- Motivo: Documentar rotação e injeção segura de segredo.
- SHA-256 final: `3854e7b128bc745d906533fc8e49932808daec811cf2796e9ac0e063a50d3323`

### ADICIONADO — `scripts/regenerate-lock.sh`

- Motivo: Fornecer regeneração determinística no ambiente correto.
- SHA-256 final: `98ad1713ffe67c6ff9116cf711deb471ea939015ee5c15c65b3df0f067ad187d`

### MODIFICADO — `vercel.json`

- Motivo: Corrigir contrato técnico identificado na auditoria.
- SHA-256 original: `08f7ba171c5a1ef2ef5006e60befa437f648aaccdaaab18caa6ee737af59cadb`
- SHA-256 final: `a4ad51585803aa9bc747f2a8e35e612fb2ec225a67e1285444d61dd08ea228ef`

### REMOVIDO — `.env`

- Motivo: Retirar valor secreto do artefato distribuível.
- SHA-256 original: `bb055de546793a583367fb5065e6437333d1246921c1bf285c8ed1098ee06421`

### REMOVIDO — `credentials/received/.env.original`

- Motivo: Retirar valor secreto do artefato distribuível.
- SHA-256 original: `bb055de546793a583367fb5065e6437333d1246921c1bf285c8ed1098ee06421`

### REMOVIDO — `package-lock.json`

- Motivo: Remover lockfile incompatível com o manifesto; regeneração exige registro npm disponível.
- SHA-256 original: `032c934ed79db9731efadcd52d0add755034ac9090a7c97dc5bb2254e4806f9f`

## Limite da declaração

A classificação não substitui assinatura, build final, aprovação de loja, homologação regulatória nem execução em infraestrutura externa.
