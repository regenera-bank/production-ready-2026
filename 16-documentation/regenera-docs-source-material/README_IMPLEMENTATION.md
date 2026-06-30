# README - Implementação de Pendências Críticas
**Autor:** Don Paulo Ricardo  
**Status:** Em andamento

---

## 1. Visão Geral

Este diretório (`pendencias resolvidas`) contém os artefatos e implementações para resolver débitos técnicos e gaps funcionais críticos que foram identificados na auditoria forense do sistema Regenera Bank.

O objetivo aqui não é perfumaria. É blindar o sistema, padronizar processos e preparar a infraestrutura para o próximo nível de escalabilidade e segurança. Cada arquivo aqui tem uma função pragmática.

## 2. Novos Processos de Deploy

Os deploys manuais ou via pipelines não documentadas acabaram. A partir de agora, usamos os seguintes scripts, que devem ser o **único** ponto de entrada para deploys.

### 2.1. `deploy-testnet.sh`

- **Propósito:** Deploy rápido e automatizado para o ambiente de `testnet` (staging).
- **Como usar:** `bash deploy-testnet.sh`
- **Funcionamento:**
  1. Puxa o código mais recente da branch `testnet`.
  2. Instala/atualiza dependências (`pnpm install`).
  3. Roda as migrações do banco de dados de teste.
  4. Recria e reinicia todos os serviços via Docker Compose.
- **Nota:** É feito para ser rápido, não seguro. Falhas são esperadas e devem ser corrigidas na branch de feature, não no script.

### 2.2. `deploy-mainnet.sh`

- **Propósito:** Deploy controlado, seguro e auditado para o ambiente de `mainnet` (produção).
- **COMO USAR:** `bash deploy-mainnet.sh`. **APENAS PESSOAL AUTORIZADO.**
- **Funcionamento (Protocolo de Segurança):**
  1. **Confirmação Manual:** O script exige confirmação explícita (`yes`) para etapas críticas.
  2. **Modo Manutenção:** Ativa um modo de manutenção via Nginx para evitar operações de usuários durante o deploy.
  3. **Backup Pré-Deploy:** Realiza um dump completo do banco de dados de produção ANTES de qualquer alteração.
  4. **Migrações:** Aplica as migrações de forma controlada.
  5. **Deploy Sequencial:** Atualiza os serviços um a um, em ordem de menor impacto, com health checks básicos entre eles. Isso simula um canary deployment para reduzir o blast radius.
  6. **Notificações:** Envia logs para um canal central e (em futuras versões) alertas para Slack/PagerDuty.
  7. **Saída do Modo Manutenção:** Desativa o modo de manutenção ao final do processo.
- **Segurança:** Este script é o guardião da produção. Qualquer alteração nele deve passar por revisão de múltiplos engenheiros sênior.

## 3. Configuração de Ambiente (`.env`)

- Encontramos um `.env.example`, mas o `.env` real para produção não existia de forma padronizada.
- Um arquivo `.env` foi criado neste diretório como o "molde" para produção.
- **Regra de Ouro:** Este arquivo **NUNCA** deve ser commitado no repositório. Ele deve ser gerenciado por uma ferramenta de secrets (como HashiCorp Vault ou AWS Secrets Manager). O arquivo aqui serve como documentação e ponto de partida para a configuração no Vault.

## 4. Novas Features (Esqueletos)

As seguintes features foram solicitadas e seus esqueletos iniciais foram criados. Eles servem como a fundação para o desenvolvimento completo.

### 4.1. Integração com IPFS

- **Arquivo:** `ipfs.service.ts`
- **Status:** Esqueleto funcional. Define a interface para upload e download de arquivos (ex: documentos de compliance, contratos) para a rede IPFS, garantindo imutabilidade e descentralização dos dados.
- **Próximos Passos:** Implementar a lógica de conexão com um nó IPFS (local ou via Infura/Pinata) e a manipulação de Buffers/Streams.

### 4.2. Sistema de Backup Triplo

- **Arquivo:** `backup-strategy.sh`
- **Status:** Script de estratégia. Define a lógica para um backup robusto do banco de dados.
- **Estratégia:**
  1. **Backup 1 (Local):** Dump local para recuperação rápida.
  2. **Backup 2 (Cloud Primária):** Cópia para um bucket S3 na mesma região.
  3. **Backup 3 (Cloud DR):** Cópia para um bucket S3 em uma região de Disaster Recovery (DR).
- **Próximos Passos:** Integrar este script a um cron job seguro no servidor de banco de dados e adicionar monitoramento para falhas de backup.

### 4.3. Selo de Verificação e QR Code

- **Arquivos:** `verification-badge.svg` e `qr-code.service.ts`
- **Status:** Placeholders.
  - O `.svg` é um selo visual para ser usado na UI, indicando uma transação ou documento verificado.
  - O `qr-code.service.ts` é o esqueleto do serviço que irá gerar QR Codes (ex: para pagamentos PIX ou compartilhamento de informações de transação).
- **Próximos Passos:**
  - Finalizar o design do selo.
  - Implementar a geração do QR Code no serviço, usando uma biblioteca como `qrcode`.

---
*Este documento é vivo. Mantenha-o atualizado à medida que as implementações avançam.*
- Don Paulo
