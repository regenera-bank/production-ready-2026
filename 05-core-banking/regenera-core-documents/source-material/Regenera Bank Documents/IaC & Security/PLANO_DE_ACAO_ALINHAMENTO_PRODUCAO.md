# Plano de Ação: Alinhamento de Práticas para o Ambiente de Produção

**Autor:** Don Paulo Ricardo, PhD  
**Status:** Crítico  
**Versão:** 1.0  
**Data:** 16 de dezembro de 2025  
**Objetivo:** Garantir a Resiliência, Automação e Auditabilidade em Produção  
**Referência:** Blueprint Estratégico v1.0, Estratégia de Redução do RTO v1.0, Estratégia Conceitual de Chaos Engineering

---

### **1. Introdução: A Produção é o Nosso Campo de Batalha Principal**

As práticas operacionais identificadas - Terraform restrito ao staging, ausência de Chaos Gamedays em produção e coleta de métricas de DR apenas em staging - representam vulnerabilidades significativas para a resiliência e a segurança do Regenera Bank. A produção não é um ambiente para suposições; é o lugar onde a disciplina e a automação devem ser implacáveis. Este plano de ação detalha as etapas corretivas para alinhar nossas práticas com a visão estratégica de um ambiente de produção inabalável.

---

### **2. Problema 1: Terraform não rodado em produção (só staging)**

#### **2.1. Implicações Críticas**
*   **Aumento do RTO:** A ausência de automação para o provisionamento e gestão da infraestrutura em produção resulta em tempos de recuperação prolongados em caso de desastre.
*   **Falta de Auditabilidade:** Alterações manuais em produção são opacas e não rastreáveis, violando princípios de segurança e conformidade.
*   **Configuration Drift:** Discrepância entre as configurações de infraestrutura em staging e produção, levando a comportamentos imprevisíveis e falhas.
*   **Riscos de Segurança:** Alterações manuais aumentam a superfície de ataque e a probabilidade de erros humanos.
*   **Violação da "Automação Implacável":** Contradiz diretamente um dos princípios fundamentais da nossa arquitetura.

#### **2.2. Plano de Ação para Retificação**
1.  **Implementar Terraform para Produção:**
    *   Converter todas as configurações de infraestrutura de produção existentes para Terraform.
    *   Refatorar os módulos Terraform para suportar múltiplos ambientes (staging, production) com variáveis distintas.
2.  **Integrar na Pipeline de CI/CD:**
    *   Estender o job de `deploy-production` na `pipeline.yml` para incluir `terraform plan` e `terraform apply`.
    *   Configurar `terraform plan` para ser executado em cada Pull Request direcionado à `main` para que as mudanças de infraestrutura sejam revisadas.
    *   Implementar um gate de aprovação manual para o `terraform apply` em produção, conforme já previsto na pipeline.
3.  **Treinamento:** Capacitar a equipe de operações e engenharia para o uso seguro e eficiente do Terraform em produção.

---

### **3. Problema 2: Gameday de Chaos não executado em produção**

#### **3.1. Implicações Críticas**
*   **Validações Não Testadas:** As suposições sobre a resiliência do ambiente de produção nunca são validadas sob condições de carga e complexidade reais.
*   **RTO/MTTR Incertos:** O verdadeiro RTO e MTTR de produção para cenários de falha críticos são desconhecidos, introduzindo riscos inaceitáveis.
*   **Fraquezas Ocultas:** Falhas de sistema só serão descobertas em um incidente real, quando o impacto é máximo.
*   **Falta de Confiança:** A equipe não adquire a confiança e a experiência necessárias para responder a incidentes em produção.

#### **3.2. Plano de Ação para Retificação**
1.  **Estratégia Faseada:**
    *   Definir um plano de implementação faseado para Chaos Gamedays em produção, começando com experimentos de baixo impacto e escopo limitado.
    *   **Fase 1 (Próximos 30 dias):** Injeção de falhas controladas e isoladas em componentes não-críticos (ex: falha de um pod de um serviço de analytics) ou degradação leve (ex: latência de 100ms para um serviço não-transacional).
    *   **Fase 2 (Próximos 60-90 dias):** Aumentar gradualmente a severidade e o escopo dos experimentos em serviços mais críticos, sempre com um "kill switch" de segurança.
2.  **Aprimorar Medidas de Segurança:**
    *   Garantir a existência de um "kill switch" robusto e automatizado para reverter qualquer experimento de caos.
    *   Limitar o "blast radius" de cada experimento a um subconjunto de usuários ou componentes.
3.  **Integrar com PagerDuty e Runbooks:**
    *   Garantir que os alertas do PagerDuty sejam acionados e que os runbooks de DR sejam executados e validados durante os Gamedays de Chaos em produção.
4.  **Treinamento e Cultura:**
    *   Promover uma cultura "blameless" em torno dos Gamedays de Chaos, focando no aprendizado e na melhoria do sistema.

---

### **4. Problema 3: Métricas DR coletadas só em ambiente staging**

#### **4.1. Implicações Críticas**
*   **Visibilidade Zero em Produção:** Nenhuma visibilidade em tempo real sobre a verdadeira prontidão de DR do ambiente de produção.
*   **RTO/RPO Não Validado:** Os objetivos de RTO/RPO de produção permanecem não validados para o ambiente real.
*   **Cenários Não Detectados:** Problemas específicos da produção que impactam a DR não são detectados (ex: limitações de rede de produção, configurações de HA de DB, problemas de replicação).
*   **Pós-Mortem Limitado:** A ausência de métricas de DR em produção dificulta a análise pós-incidente.

#### **4.2. Plano de Ação para Retificação**
1.  **Estender Coleta de Métricas de DR para Produção:**
    *   Configurar dashboards de métricas de DR (DR Metrics Dashboard) para monitorar RTO, RPO, MTTD, MTTR e status de health checks **exclusivamente para o ambiente de produção**.
    *   Garantir que métricas de replicação de banco de dados, status de failover de serviços críticos e prontidão de ambientes de standby sejam coletadas em produção.
2.  **Alertas de DR Específicos para Produção:**
    *   Configurar alertas agressivos no PagerDuty baseados em métricas de DR de produção (ex: falha de Health Checks primários, atraso de replicação excedendo RPO).
3.  **Validação Contínua:**
    *   Utilizar os dados de produção para validar e refinar os SLOs/SLAs de DR e os planos de recuperação.

---

### **5. Conclusão: A Produção Como Farol de Excelência**

A retificação destas três áreas críticas é imperativa para a integridade operacional do Regenera Bank. Ao implementar Terraform em produção, executar Chaos Gamedays de forma controlada e estender a coleta de métricas de DR para o ambiente produtivo, fortaleceremos a fundação da nossa resiliência. A produção será o nosso farol de excelência, demonstrando a capacidade inabalável do Regenera Bank de operar com segurança, automação e total conformidade, independentemente das adversidades.
