# Incidente de lockfile do frontend

O `package-lock.json` recebido não correspondia ao `package.json`. A validação do npm apontou versões incompatíveis de React, tipos, Zod, Zustand e dependências Expo que não pertencem ao frontend Vite.

O lockfile inválido foi removido. Não foi substituído por conteúdo inventado porque o registro npm ficou indisponível durante a tentativa de resolução.

## Saída do bloqueio

Execute o script de regeneração incluído neste pacote em Node 22.18+ com acesso confiável ao registro npm. O novo lockfile só pode ser aceito após `npm ci`, lint, testes e build concluírem sem `--force`.

Até isso ocorrer, o frontend está **bloqueado por lockfile e build não reproduzível**.
