# Dashboard de FinOps Conceitual: Monitoramento de Custos no EKS para o Regenera Bank

**Autor:** Don Paulo Ricardo, PhD  
**Status:** Conceitual  
**Versão:** 1.0  
**Data:** 16 de dezembro de 2025  
**Referência:** Blueprint Estratégico do Regenera Bank v1.0 (Fase 3: Inovação e Expansão - FinOps)

---

### **1. Introdução: A Governança Financeira da Nuvem**

No ecossistema Regenera Bank, a gestão de custos na nuvem (FinOps) é tão crítica quanto a performance e a segurança. Um Dashboard de FinOps robusto fornece visibilidade total sobre o consumo de recursos e os custos associados no nosso cluster EKS, permitindo decisões estratégicas baseadas em dados para otimização e sustentabilidade. Este documento conceitual detalha o que tal dashboard deveria apresentar e como ele se alinha com nossos pilares de conformidade e governança.

---

### **2. Métricas Chave do Dashboard de FinOps**

O dashboard deve consolidar métricas financeiras e de utilização, traduzindo complexidade técnica em informações acionáveis para diferentes públicos (engenheiros, gestores, finanças).

*   **Custos por Serviço/Microserviço:**
    *   Custo total por Deployment/StatefulSet no Kubernetes.
    *   Custo de CPU por serviço.
    *   Custo de Memória por serviço.
    *   Custo de Armazenamento (Persistent Volumes) por serviço.
*   **Custos por Namespace/Domínio de Negócio:**
    *   Visão agregada dos custos para domínios específicos (e.g., `auth-domain`, `transaction-domain`).
    *   Permite alocação de custos e responsabilidade.
*   **Utilização de Recursos vs. Custo (Waste Analysis):**
    *   Comparação entre `requests` e `limits` configurados vs. uso real de CPU e Memória.
    *   Identificação de pods/deployments com alta ociosidade (recursos provisionados mas não utilizados).
    *   Identificação de gargalos (recursos subdimensionados).
*   **Tendências de Custo:**
    *   Evolução diária/semanal/mensal dos custos totais e por serviço.
    *   Detecção de picos ou anomalias de custo.
*   **Custo por Transação/Unidade de Negócio (se aplicável):**
    *   Métrica avançada para correlacionar custos de infraestrutura com métricas de negócio (e.g., custo por login, custo por transação Pix).
*   **Cobertura de Otimização:**
    *   Visualização da porcentagem de pods com `requests` e `limits` definidos.
    *   Identificação de recursos sem tag de custo ou identificação.

---

### **3. Estrutura Conceitual do Dashboard**

O dashboard deve ser intuitivo e hierárquico, permitindo uma visão geral e aprofundamento em detalhes.

#### **3.1. Visão Geral (Executiva/Gerencial)**
*   **Custo Total do Cluster EKS:** Visão geral dos custos mensais/diários.
*   **Top N Serviços/Namespaces por Custo:** Identificação rápida dos maiores consumidores.
*   **Média de Utilização do Cluster:** CPU e Memória.
*   **Potencial de Economia:** Estimativas baseadas em recomendações de redimensionamento.

#### **3.2. Detalhamento de Custos (Técnico/Engenharia)**
*   **Gráficos de Linha/Barra:** Mostrando custo por serviço, por recurso (CPU, Memória, PVs).
*   **Tabelas Drill-down:** Permitindo aprofundar do namespace para o deployment, para o pod.
*   **Análise de "Unallocated Costs":** Custos não atribuídos a nenhum serviço específico (e.g., recursos do Control Plane do EKS).

#### **3.3. Otimização de Recursos (Técnico)**
*   **Recomendações de Redimensionamento:** Sugestões para ajustar `requests` e `limits` de CPU/Memória.
*   **Identificação de Recursos Ociosos:** Pods/Deployments que podem ser escalados para baixo ou eliminados.
*   **Alertas de Provisão:** Notificações sobre serviços sem `requests`/`limits` definidos.

#### **3.4. Orçamento vs. Real (Gerencial/Finanças)**
*   Comparação dos custos reais com os orçamentos planejados por domínio de negócio ou time.

---

### **4. Ferramentas Recomendadas**

Para implementar tal dashboard no ambiente AWS EKS:

*   **Kubecost:** Solução líder para monitoramento de custos em Kubernetes, fornecendo granularidade por pod, deployment, namespace, e integrando-se diretamente com o AWS. Oferece detecção de desperdício e recomendações de otimização.
*   **CloudHealth (VMware by Broadcom):** Plataforma abrangente de gestão de custos e otimização para nuvem, que pode ser integrada com o Kubecost ou utilizada para uma visão mais ampla de multi-cloud/infraestrutura híbrida.
*   **AWS Cost Explorer & CUR (Cost and Usage Report):** Para dados brutos de custos da AWS, essenciais para a integração e validação das ferramentas de terceiros.

---

### **5. Conclusão: A Disciplina do Capital**

O Dashboard de FinOps não é apenas uma ferramenta de monitoramento; é um artefato de governança que transforma a gestão de custos na nuvem de uma reatividade financeira para uma proatividade estratégica. Ele permite que o Regenera Bank opere com máxima eficiência de capital, realocando recursos para impulsionar a inovação e a regeneração financeira. Implementar e manter este dashboard é um imperativo para a sustentabilidade e o sucesso de longo prazo do nosso ecossistema.
