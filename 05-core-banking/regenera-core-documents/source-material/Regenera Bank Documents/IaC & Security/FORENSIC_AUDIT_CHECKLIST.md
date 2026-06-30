# Checklist de Auditoria Forense - Regenera Bank
**Autor:** Don Paulo Ricardo  
**Classificação:** Confidencial Interno  
**Versão:** 1.0

---

## Introdução

Este documento é o checklist padrão para a condução de auditorias forenses no ecossistema Regenera Bank. O objetivo é garantir, de forma sistemática e auditável, que nossos sistemas mantêm os mais altos níveis de segurança, integridade e conformidade.

Cada item deve ser verificado e assinado (com data e responsável) durante uma auditoria.

---

### Fase 1: Integridade do Código e do Build

| Item de Verificação | Status (Pendente/OK/Falha) | Responsável | Data | Evidência / Comentários |
| :--- | :--- | :--- | :--- | :--- |
| **1.1.** O manifesto de hashes (`manifest.sha256`) foi gerado a partir do commit exato do build de produção? | | | | Anexar commit hash e link para o pipeline de build. |
| **1.2.** A verificação de hashes (`verify_deployment_integrity.sh verify`) foi executada no ambiente de produção pós-deploy? | | | | Anexar log de execução do script. O resultado deve ser 100% OK. |
| **1.3.** Nenhum arquivo em produção foi modificado manualmente após o deploy? | | | | Comparar hashes de arquivos críticos (e.g., binários de serviços) com o manifesto. |
| **1.4.** Todos os branches de feature foram mergeados e deletados após o deploy em produção? | | | | Print do status do repositório Git. Nenhum branch de feature antigo deve permanecer. |

### Fase 2: Gestão de Acesso e Segredos

| Item de Verificação | Status (Pendente/OK/Falha) | Responsável | Data | Evidência / Comentários |
| :--- | :--- | :--- | :--- | :--- |
| **2.1.** Todos os segredos de produção (senhas, API keys, JWT secrets) estão armazenados no HashiCorp Vault? | | | | Print da configuração do Vault para o projeto Regenera, ofuscando os segredos. |
| **2.2.** O arquivo `.env.production` ou similar **NÃO** existe no ambiente de produção? | | | | Confirmação via `ls -la` no diretório raiz da aplicação em produção. |
| **2.3.** As políticas de acesso ao Vault (ACLs) concedem permissão mínima necessária para cada serviço/operador? | | | | Anexar política de ACL para um serviço (e.g., `transaction-service`). |
| **2.4.** O acesso SSH/RDP aos servidores de produção é feito via Bastion Host e com autenticação de múltiplos fatores (MFA)? | | | | Diagrama de rede da AWS e configuração do grupo de segurança do Bastion. |
| **2.5.** A rotação de segredos (especialmente `JWT_ACCESS_TOKEN_SECRET` e senhas de banco de dados) está agendada e funcionando? | | | | Log do serviço de rotação ou configuração no Vault. Política de rotação a cada 90 dias. |

### Fase 3: Segurança de Dados e Transações

| Item de Verificação | Status (Pendente/OK/Falha) | Responsável | Data | Evidência / Comentários |
| :--- | :--- | :--- | :--- | :--- |
| **3.1.** Todos os dados sensíveis de clientes (PII) estão criptografados em repouso (at-rest) no banco de dados? | | | | Configuração de criptografia do RDS/PostgreSQL (e.g., `pgcrypto`). |
| **3.2.** A comunicação entre todos os microsserviços é feita via TLS 1.2+? | | | | Configuração do service mesh (Istio/Linkerd) ou validação via `openssl s_client`. |
| **3.3.** O `ValueObject` `Money` é usado para **TODAS** as operações financeiras? Foi verificado que nenhum `float` é usado? | | | | Revisão de código de 3 a 5 transações críticas no `transaction-service` e `pix-service`. |
| **3.4.** As transações financeiras seguem o padrão ACID? As operações são atômicas e isoladas? | | | | Análise de uma transação de débito/crédito no código, mostrando o uso de `Transaction` do TypeORM. |
| **3.5.** Logs de transação contêm apenas IDs e metadados, nunca informações sensíveis (PII, senhas, etc.)? | | | | Amostra de logs de produção do `transaction-service`. |

### Fase 4: Análise de Dependências

| Item de Verificação | Status (Pendente/OK/Falha) | Responsável | Data | Evidência / Comentários |
| :--- | :--- | :--- | :--- | :--- |
| **4.1.** Uma varredura de vulnerabilidades de dependências (e.g., `pnpm audit`, Snyk) foi executada no build? | | | | Relatório do Snyk/`pnpm audit` do build de produção. Nenhuma vulnerabilidade crítica/alta deve existir. |
| **4.2.** O `pnpm-lock.yaml` está sendo usado para garantir builds determinísticos? | | | | Log do pipeline de CI/CD mostrando o uso do lockfile (`pnpm install --frozen-lockfile`). |
| **4.3.** Nenhuma dependência "exótica" ou sem manutenção foi adicionada ao projeto? | | | | Revisão manual das dependências no `package.json` de cada serviço. |

---

### Conclusão da Auditoria

**Auditor Líder:**
**Data da Conclusão:**
**Resultado Geral (Aprovado / Aprovado com Ressalvas / Reprovado):**

**Sumário Executivo:**
(Breve resumo das descobertas, pontos fortes e ações corretivas necessárias.)

**Assinatura:**
_________________________
(Nome e Cargo)
