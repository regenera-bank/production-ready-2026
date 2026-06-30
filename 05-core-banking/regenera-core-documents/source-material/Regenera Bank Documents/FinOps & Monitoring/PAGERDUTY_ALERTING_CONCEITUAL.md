# Estratégia de PagerDuty e Alertamento Agressivo

**Autor:** Don Paulo Ricardo, PhD  
**Status:** Conceitual  
**Versão:** 1.0  
**Data:** 16 de dezembro de 2025  
**Objetivo:** Reduzir MTTR e alcançar RTO < 5 minutos  
**Referência:** Blueprint Estratégico v1.0 (Fase 2, Item 2), Estratégia de Redução do RTO v1.0

---

### **1. Introdução: O Guardião da Resiliência**

No Regenera Bank, a detecção e resposta a incidentes devem ser imediatas e decisivas. A configuração do PagerDuty, com uma estratégia de alertamento agressivo, é o pilar que garante a notificação proativa da equipe de plantão, minimizando o Mean Time To Detect (MTTD) e o Mean Time To Resolve (MTTR), e sendo, portanto, vital para alcançar nosso objetivo de RTO (Recovery Time Objective) de menos de 5 minutos.

---

### **2. Conceitos Chave do PagerDuty na Nossa Arquitetura**

*   **Serviços (PagerDuty Services):** Cada microsserviço crítico (ex: `auth-service`, `transaction-service`) ou domínio operacional (ex: "Infraestrutura EKS", "Monitoramento de Banco de Dados") terá um Serviço PagerDuty dedicado. Isso permite granularidade na configuração de alertas e políticas de escalonamento.
*   **Políticas de Escalonamento (Escalation Policies):** Definem a sequência de notificações (via telefone, SMS, e-mail, push notification) e os caminhos de escalonamento para as equipes de plantão, garantindo que o incidente não fique sem resposta.
*   **Agendamentos (Schedules):** Gerenciam os engenheiros que estão de plantão em determinados horários, integrando-se com calendários e rotações.
*   **Integrações:** Conectam as fontes de alerta (Prometheus Alertmanager, AWS CloudWatch, Datadog, etc.) ao PagerDuty, traduzindo alertas em incidentes acionáveis.

---

### **3. Princípios do Alertamento Agressivo (Lei da Vigilância)**

Nosso approach de alertamento é regido por princípios que visam a ação imediata e eficaz:

1.  **Alertas Acionáveis:** Cada alerta deve indicar um problema real e exigir uma ação específica. Evitar "ruído" e alertas falsos positivos que causam fadiga na equipe.
2.  **Zero Alert Storms:** Utilizar técnicas de deduplicação, agrupamento inteligente e supressão de alertas no sistema de monitoramento (Alertmanager) antes de enviar para o PagerDuty.
3.  **Pessoa Certa, Hora Certa:** Garantir que o alerta chegue ao engenheiro de plantão atual, com base em agendamentos e políticas de escalonamento claras.
4.  **Detecção Precoce:** Configurar thresholds de alerta para detectar anomalias *antes* que impactem severamente o usuário final, utilizando métricas preditivas quando possível.
5.  **Contexto para Resolução Rápida:** Cada alerta deve conter informações essenciais (service, environment, playbook URL, métricas relevantes, logs correlacionados) para acelerar o diagnóstico e a resolução.

---

### **4. Estratégia de Configuração (Conceitual)**

#### **4.1. Mapeamento de Serviços Críticos**
*   **PagerDuty Services:** Um serviço PagerDuty para cada microsserviço crítico (`auth-service`, `transaction-service`, `user-service`, `api-gateway`, etc.), e para componentes de infraestrutura (`EKS Cluster Control Plane`, `RDS`, `RabbitMQ`).

#### **4.2. Políticas de Escalonamento em Camadas**
*   **L1 (Engenheiro de Plantão):** Notificação imediata (push, SMS, telefone). Tempo limite de 5 minutos para reconhecimento ou resolução.
*   **L2 (Engenheiro Sênior/Líder Técnico):** Escalonar automaticamente se L1 não responder. Tempo limite de 10 minutos.
*   **L3 (Gerente de Engenharia/CTO):** Escalonar se L2 não responder.

#### **4.3. Agendamentos de Plantão**
*   Configurar agendamentos rotativos 24/7 para as equipes de plantão, garantindo cobertura contínua e equilíbrio de vida/trabalho.

#### **4.4. Integrações e Fontes de Alerta**
*   **Prometheus Alertmanager:** Principal integração. Configurar o Alertmanager para enviar alertas críticos ao PagerDuty.
*   **AWS CloudWatch / Sentry / DataDog:** Outras fontes de alerta podem ser integradas diretamente ao PagerDuty via APIs ou webhooks.

#### **4.5. Regras de Alerta para Métricas Críticas**
*   **Disponibilidade:** Alertas imediatos para `service down`, `pod not ready`, `node unavailable`.
*   **Performance:** Latência (p99) > SLO, utilização de CPU/Memória > 80% (`limits`), taxa de requisições reduzida.
*   **Erros:** Taxa de erros (5xx) > 1%, logs de erro críticos (`CRITICAL`, `ERROR`).
*   **Segurança:** Tentativas de login falhas excessivas, acesso não autorizado a segredos.

#### **4.6. Runbooks Automatizados**
*   Cada alerta deve ter um link para um runbook detalhado (documentação no Confluence/GitHub Wiki) que guie o engenheiro de plantão na resolução do incidente, incluindo passos de diagnóstico, mitigação e rollback.

---

### **5. Conclusão: Vigilância Constante, Recuperação Implacável**

A implementação de uma estratégia de PagerDuty e alertamento agressivo é uma manifestação direta do nosso compromisso com a excelência operacional e a redução do RTO. Ao garantir que cada incidente seja detectado rapidamente e escalonado eficientemente, o Regenera Bank fortalece sua capacidade de resposta, protege seus serviços críticos e solidifica sua reputação de confiabilidade inabalável.
