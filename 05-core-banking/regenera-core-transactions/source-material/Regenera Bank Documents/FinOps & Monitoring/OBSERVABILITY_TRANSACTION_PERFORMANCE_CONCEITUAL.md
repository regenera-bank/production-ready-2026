# Observabilidade de Performance de Transações: OpenTelemetry e Logs Estruturados

**Autor:** Don Paulo Ricardo, PhD  
**Status:** Conceitual  
**Versão:** 1.0  
**Data:** 16 de dezembro de 2025  
**Objetivo:** Identificar gargalos e latências em transações de microsserviços  
**Referência:** Análise Arquitetural Completa, Princípios de Observabilidade Total

---

### **1. Introdução: Onde o Sistema Realmente Dói**

No complexo ambiente de microsserviços do Regenera Bank, a simples coleta de logs não é suficiente para entender o comportamento do sistema sob carga. Precisamos de ferramentas que revelem exatamente "onde dói" - quanto tempo uma transação demorou, qual microsserviço introduziu latência e onde ocorrem os gargalos. Este documento conceitual descreve a estratégia para implementar **OpenTelemetry** e **Logs Estruturados (JSON Logs)** para fornecer uma observabilidade profunda da performance de transações.

---

### **2. O Desafio: Transações Distribuídas e Gargalos Ocultos**

Uma transação de negócio no Regenera Bank (ex: uma transferência PIX) atravessa múltiplos microsserviços, cada um com suas próprias dependências de rede e banco de dados. Um atraso de 100ms em um serviço pode se propagar e se multiplicar, resultando em uma latência inaceitável para o usuário final. Logs em formato de texto livre e métricas agregadas podem ocultar a raiz do problema.

---

### **3. Solução 1: OpenTelemetry para Traces Distribuídos**

OpenTelemetry é um conjunto de ferramentas, APIs e SDKs que padroniza a coleta de telemetria (traces, métricas e logs) de aplicações. Seu foco principal aqui é o **Tracing Distribuído**.

#### **3.1. Como Ajuda a Encontrar Gargalos:**
*   **Visibilidade Ponta a Ponta:** Um trace (rastreamento) é uma representação de uma única requisição conforme ela viaja através de múltiplos serviços. Ele mostra a hierarquia das chamadas, o tempo gasto em cada serviço (span) e as chamadas RPC/HTTP/DB dentro de cada serviço.
*   **Identificação de Latência:** Facilita a visualização do tempo de execução em cada "hop" da transação, identificando o serviço ou a operação específica que está causando o atraso.
*   **Descoberta de Dependências:** Ajuda a mapear as dependências entre microsserviços e sistemas externos.

#### **3.2. Implementação Conceitual:**
*   **Instrumentação:**
    *   Adicionar bibliotecas SDK do OpenTelemetry a cada microsserviço NestJS (e frontends), para coletar traces.
    *   A instrumentação pode ser automática (para chamadas HTTP/gRPC/DB comuns) ou manual (para operações de negócio específicas).
*   **Context Propagation:**
    *   Garantir que o "trace context" (Trace ID e Span ID) seja propagado automaticamente entre os serviços via headers HTTP/gRPC. O Istio Service Mesh pode auxiliar nisso.
*   **Exporters:**
    *   Configurar os SDKs do OpenTelemetry para enviar os traces coletados para um backend de tracing (ex: Jaeger).
*   **Custom Spans:**
    *   Criar spans customizados para operações de negócio críticas que não são automaticamente instrumentadas (ex: passos específicos dentro de uma SAGA, validações complexas).

---

### **4. Solução 2: Logs Estruturados (JSON Logs)**

Logs estruturados formatam as informações de log como JSON, em vez de texto livre.

#### **4.1. Como Ajuda a Correlacionar e Analisar Eventos:**
*   **Consultas Poderosas:** Permitem consultas ricas em plataformas de agregação de logs (Elasticsearch/Kibana, Loki/Grafana), filtrando por qualquer campo JSON (ex: `transaction_id`, `user_id`, `service_name`, `error_code`).
*   **Correlação com Traces:** Um campo `trace_id` injetado no log permite correlacionar logs de diferentes serviços com um único trace distribuído.
*   **Contexto Rico:** Incluir metadados relevantes em cada log (timestamp, nível, serviço, hostname, `user_id`, `transaction_id`, `operation_duration_ms`).

#### **4.2. Implementação Conceitual:**
*   **Bibliotecas de Logging:** Utilizar bibliotecas de logging que suportam saída JSON (ex: Winston/Pino no Node.js).
*   **Contexto de Transação:** Em cada requisição de entrada, gerar ou extrair um `transaction_id` (se não vier do OpenTelemetry como `trace_id`) e injetá-lo no contexto de log para toda a duração da requisição.
*   **Tempos e Duração:** Registrar explicitamente o início, fim e duração (`duration_ms`) de operações críticas (ex: chamadas a APIs externas, queries de banco de dados).
*   **Eventos Chave:** Logar eventos importantes de negócio ou do sistema (início de SAGA, compensação, erro, retry) com todos os metadados relevantes.

---

### **5. A Sinergia da Observabilidade**

A verdadeira força reside na combinação dessas soluções:

*   **OpenTelemetry Traces:** Mostram a "linha do tempo" visual e a latência entre serviços.
*   **Logs Estruturados:** Fornecem os "detalhes" contextuais de cada evento ou erro dentro de um serviço, correlacionados pelo `trace_id`.
*   **Métricas (Prometheus/Grafana):** Oferecem os "agregados numéricos" (contagens, taxas de erro, médias de latência) para monitoramento em alto nível.

Com essa sinergia, podemos, por exemplo:
*   Encontrar todas as transações que demoraram mais de 500ms, usando métricas.
*   Drill down para o trace específico (via `trace_id`) para ver cada "hop" e qual serviço foi o gargalo.
*   Aprofundar nos logs estruturados (filtrando pelo `trace_id`) para entender os detalhes de código e erros dentro do serviço problemático.

---

### **6. Conclusão: Onde Dói e Por Que**

A implementação de OpenTelemetry e Logs Estruturados no Regenera Bank não é uma opção; é uma necessidade estratégica para a "Observabilidade Total". Ao fornecer visibilidade granular sobre a performance das transações, podemos identificar e resolver gargalos rapidamente, manter nossos SLOs/SLAs, reduzir o MTTR e construir um sistema que "fala" claramente onde dói, permitindo-nos otimizar continuamente para a excelência e resiliência.
