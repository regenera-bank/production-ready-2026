# Plano de Migração Conceitual: Adoção de 100% IaC em Produção com Terraform

**Autor:** Don Paulo Ricardo, PhD  
**Status:** Conceitual  
**Versão:** 1.0  
**Data:** 16 de dezembro de 2025  
**Objetivo:** Gerenciar 100% da Infraestrutura de Produção via Código (IaC) e Eliminar "Configuration Drift"  
**Referência:** Plano de Ação: Alinhamento de Práticas para o Ambiente de Produção v1.0 (Problema 1)

---

### **1. Introdução: A Infraestrutura Como Código Inegociável**

A gestão de 100% da infraestrutura de produção via Código (IaC) é um pilar fundamental da nossa disciplina de engenharia. A prática atual de não rodar Terraform em produção introduz "configuration drift", riscos de segurança, RTO elevado e falta de auditabilidade. Este documento conceitual descreve o plano de migração para trazer toda a infraestrutura de produção do Regenera Bank sob o gerenciamento do Terraform, garantindo consistência, rastreabilidade e automação implacável.

---

### **2. Objetivos da Migração**

*   **Eliminar Configuration Drift:** Garantir que a configuração real dos recursos de produção corresponda exatamente à sua definição no código Terraform.
*   **Aumentar a Auditabilidade:** Todas as mudanças na infraestrutura de produção serão rastreáveis via controle de versão (Git).
*   **Reduzir RTO e RPO:** Aumentar a velocidade e a confiabilidade da recuperação de desastres através de provisionamento automatizado e reprodutível.
*   **Padronização e Reprodutibilidade:** Assegurar que os ambientes sejam provisionados de forma idêntica e consistente.
*   **Melhorar a Segurança:** Reduzir o risco de erros humanos e a superfície de ataque por meio de processos automatizados e revisados.

---

### **3. Desafios Chave**

*   **Identificação de Recursos "Unmanaged":** Achar e mapear todos os recursos de produção que não estão atualmente sob controle do Terraform.
*   **Impacto Zero no Serviço:** A migração deve ser realizada com impacto mínimo ou nulo na disponibilidade dos serviços em produção.
*   **Gestão de Estado:** Gerenciar o estado do Terraform de forma segura e consistente, especialmente durante a importação de recursos.
*   **Educação e Adoção da Equipe:** Garantir que as equipes estejam treinadas e sigam as novas práticas de IaC para produção.

---

### **4. Estratégia de Migração Faseada**

A migração será executada em fases, com foco na segurança e na minimização de riscos.

#### **4.1. Fase 1: Descoberta e Documentação (1-2 Semanas)**
*   **Inventário de Recursos:** Utilizar ferramentas (ex: AWS Config, `aws cli`) para listar *todos* os recursos da AWS em produção.
*   **Mapeamento:** Identificar quais recursos são essenciais e devem ser gerenciados por Terraform.
*   **Documentação da Configuração Atual:** Capturar a configuração atual dos recursos (tags, security groups, etc.) para referência.
*   **Priorização:** Classificar recursos por criticidade e facilidade de migração.

#### **4.2. Fase 2: Importação e Gestão de Estado (2-4 Semanas)**
*   **Configuração de Backend Remoto:** Configurar um backend S3 seguro com bloqueio DynamoDB para armazenar o estado do Terraform de produção.
*   **Início com Recursos Não-Críticos:** Começar a migrar recursos de menor risco (ex: DNS entries, S3 buckets secundários) usando `terraform import`.
*   **Validação da Importação:** Após cada importação, executar `terraform plan` para garantir que o estado importado corresponde à configuração do código.
*   **Módulos Adotivos:** Criar módulos Terraform para "adotar" esses recursos, em vez de criar do zero.

#### **4.3. Fase 3: Refatoração e Padronização (4-8 Semanas)**
*   **Módulos Reutilizáveis:** Refatorar as configurações Terraform para usar módulos genéricos e reutilizáveis, conforme nosso `TERRAFORM_MIGRATION_PLAN_CONCEITUAL.md` (e.g., módulos para VPC, EKS, RDS, Security Groups).
*   **Nomenclatura e Tagging:** Aplicar as convenções de nomenclatura e tagging definidas para todos os recursos.
*   **Variáveis e Outputs:** Padronizar o uso de variáveis e outputs para facilitar a composição de ambientes.
*   **Testes de IaC:** Implementar `terraform validate` e `terraform fmt` para garantir a qualidade do código.

#### **4.4. Fase 4: Integração CI/CD e Enforcement (Contínuo)**
*   **Integração com Pipeline de Produção:** Integrar o Terraform `plan` e `apply` na pipeline de CI/CD de produção (`pipeline.yml`), com gates de aprovação manual rigorosos.
*   **Static Analysis:** Implementar ferramentas de análise estática (ex: `tfsec`, `checkov`) para verificar segurança e conformidade em cada PR.
*   **Política de "No Manual Changes":** Implementar mecanismos para detectar e reverter alterações manuais em recursos gerenciados por Terraform (ex: AWS Config Rules).
*   **Monitoramento da Conformidade:** Utilizar métricas para monitorar a porcentagem da infraestrutura gerenciada via IaC.

---

### **5. Ferramentas e Tecnologias**

*   **Terraform CLI:** Ferramenta principal para gerenciamento de IaC.
*   **AWS CLI:** Para descoberta de recursos e operações auxiliares.
*   **Git & GitHub Actions:** Para controle de versão do código Terraform e orquestração da pipeline de CI/CD.
*   **AWS Config:** Para monitorar e auditar alterações na infraestrutura da AWS.
*   **Terraform Import:** Para incorporar recursos existentes no estado do Terraform.

---

### **6. Estratégias de Mitigação de Risco**

*   **Início Gradual:** Começar a migração com recursos de baixo risco e avançar para os mais críticos.
*   **Backups do Estado:** Manter backups regulares e seguros do estado do Terraform.
*   **Revisão Rigorosa:** Todos os PRs com mudanças de infraestrutura devem passar por revisão de pares e aprovação da equipe de SRE/DevOps.
*   **Plano de Rollback:** Ter um plano de rollback claro e testado para cada etapa da migração.

---

### **7. Conclusão: O Futuro da Infraestrutura é Codificado**

A migração para 100% de IaC em produção é um imperativo estratégico para o Regenera Bank. Este plano conceitual, quando executado com disciplina e rigor, eliminará o configuration drift, aumentará a confiabilidade, a segurança e a agilidade de nossa infraestrutura. Ao abraçar a infraestrutura como código de forma completa, solidificamos nossa capacidade de inovar e de oferecer um serviço financeiro resiliente e de ponta.
