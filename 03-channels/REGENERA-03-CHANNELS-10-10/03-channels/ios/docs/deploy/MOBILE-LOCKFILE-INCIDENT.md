# Incidente de lockfile mobile

O `package-lock.json` recebido não correspondia ao `package.json`: o npm identificou TypeScript incompatível e dependência `react-native-worklets` ausente.

O lockfile inválido foi removido. O script `scripts/regenerate-mobile-lock.sh` reconstrói o contrato em Node 22.18+ e só aceita a saída após `npm ci` e typecheck.

Até a regeneração em ambiente com registro npm estável, o build nativo permanece bloqueado.
