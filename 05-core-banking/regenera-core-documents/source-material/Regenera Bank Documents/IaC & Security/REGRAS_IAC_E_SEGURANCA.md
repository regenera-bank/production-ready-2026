# Regras de Desenvolvimento e Infraestrutura: Pilares de Alto Volume e IaC

**Autor:** Don Paulo Ricardo, PhD  
**Status:** Confidencial  
**Versão:** 1.0  
**Data:** 16 de dezembro de 2025  
**Referência:** Blueprint Estratégico do Regenera Bank v1.0, Manual de Regras de Engenharia v1.0

---

### **1. Regras de Desenvolvimento de Alto Volume: A Força da Escala**

Desenvolver para alto volume exige uma mentalidade de otimização contínua. Cada decisão de design e implementação deve considerar o impacto na performance, escalabilidade e custo operacional sob carga máxima.

#### **1.1. Otimização de Consultas e Operações de I/O**
*   **Consultas a Banco de Dados:**
    *   **Proibido `SELECT *` em produção:** Selecionar apenas as colunas necessárias.
    *   **Indexação Estratégica:** Garantir que todas as colunas usadas em cláusulas `WHERE`, `JOIN` e `ORDER BY` estejam devidamente indexadas.
    *   **Análise de Query:** Usar ferramentas como `EXPLAIN ANALYZE` (PostgreSQL) para otimizar queries lentas.
    *   **Batching/Bulk Operations:** Priorizar operações em lote para inserções, atualizações e exclusões massivas, minimizando o overhead de rede e transações.
*   **Operações de Rede/APIs Externas:**
    *   **Circuit Breakers:** Implementar Circuit Breakers (via `@repo/resilience` package) em chamadas a serviços externos e microserviços para prevenir cascateamento de falhas.
    *   **Timeouts:** Definir timeouts agressivos para todas as chamadas de rede para evitar que serviços lentos bloqueiem recursos.
    *   **Retries:** Implementar estratégias de retry com backoff exponencial para chamadas a serviços externos e APIs instáveis.
*   **Assincronia e Paralelismo:** Utilizar filas de mensagem (RabbitMQ) para processamento de tarefas em background que não exigem resposta imediata, liberando recursos de threads e evitando bloqueios.

#### **1.2. Cache Estratégico**
*   **Redis:** Utilizar Redis (`redis_db` do `docker-compose.yml`) para cache de dados frequentemente acessados, mas de baixa volatilidade. Implementar estratégias de invalidation/expiração de cache.
*   **Cache de Nível de Aplicação:** Implementar caches locais (in-memory) para dados de configuração ou lookup que raramente mudam, reduzindo a latência e a carga sobre os bancos de dados.

#### **1.3. Tratamento de Concorrência e Transações Distribuídas**
*   **Idempotência:** Projetar endpoints para serem idempotentes sempre que possível, especialmente para operações que podem ser retentadas.
*   **Transações Distribuídas:** Evitar transações ACID distribuídas. Preferir padrões de **Saga** ou **Compensating Transactions** para garantir a consistência eventual em operações que abrangem múltiplos serviços.
*   **Atomicidade:** Garantir que operações críticas dentro de um serviço sejam atômicas.

#### **1.4. Controle de Recursos (Kubernetes)**
*   **Requests e Limits:** Todos os deployments de microserviços no Kubernetes devem especificar `requests` e `limits` para CPU e memória, garantindo alocação justa e prevenindo o esgotamento de recursos do cluster.
*   **Horizontal Pod Autoscaler (HPA):** Configurar HPA para escalar automaticamente os microserviços com base em métricas de CPU/Memória ou métricas customizadas de negócio.

---

### **2. Regras de Infraestrutura como Código (IaC) - Terraform: A Fundação Programável**

A infraestrutura é o código que define nosso ambiente operacional. Ela deve ser tratada com a mesma disciplina e rigor que o código de aplicação.

#### **2.1. Organização e Reutilização de Módulos**
*   **Estrutura do Repositório (`infrastructure/aws/`):** A organização deve seguir um padrão claro, com módulos Terraform bem definidos para cada componente principal da infraestrutura (e.g., `vpc.tf`, `eks.tf`, `rds.tf`, `security.tf`).
*   **Módulos Reutilizáveis:** Priorizar a criação e o uso de módulos Terraform genéricos e reutilizáveis (e.g., usando `terraform-aws-modules`) para provisionar recursos comuns (VPCs, Security Groups, EKS). Isso promove consistência e reduz a duplicação.

#### **2.2. Nomenclatura Padrão para Recursos**
*   **Convenção:** Implementar uma convenção de nomenclatura rigorosa para todos os recursos da AWS provisionados via Terraform (ex: `regenera-bank-{environment}-{service_name}-{resource_type}`). Isso facilita a identificação e o gerenciamento.

#### **2.3. Validação e Testes de Terraform**
*   **`terraform validate`:** Executar esta etapa em cada Pull Request para verificar a sintaxe e a configuração do Terraform.
*   **`terraform plan`:** Gerar um `terraform plan` como parte do processo de CI, com o output sendo anexado ao Pull Request para revisão. Isso permite que os revisores visualizem as mudanças propostas na infraestrutura antes da aplicação.
*   **Testes de Integração de IaC (Terratest):** Para módulos críticos de infraestrutura, implementar testes com `Terratest` ou ferramentas similares para validar o comportamento dos recursos provisionados.

#### **2.4. Gerenciamento de Estado do Terraform**
*   **Backend Remoto:** O estado do Terraform (`terraform.tfstate`) deve ser armazenado em um backend remoto seguro (e.g., bucket S3 da AWS com versionamento e criptografia ativados).
*   **Bloqueio de Estado (State Locking):** Utilizar um mecanismo de bloqueio de estado (e.g., DynamoDB) para prevenir modificações concorrentes e inconsistências no estado.

---

### **3. Detalhes de Implementação de Segurança: A Vigilância Constante**

A segurança é um valor intrínseco, não um recurso adicionado. Detalhes na implementação garantem que nossos dados e sistemas permaneçam impenetráveis.

#### **3.1. Gerenciamento de Segredos (AWS Secrets Manager / HashiCorp Vault)**
*   **Princípio de Menor Privilégio:** Microserviços devem ter permissões mínimas necessárias para acessar apenas os segredos de que precisam, através de políticas de acesso granular.
*   **Acesso via SDKs ou Sidecars:**
    *   **SDKs (Preferred):** A maneira mais segura de acessar segredos é via SDKs da AWS (e.g., `aws-sdk`) que se integram diretamente com o Secrets Manager, utilizando IAM Roles for Service Accounts (IRSA) no EKS.
    *   **Sidecars/Injetores (Alternativa):** Para aplicações que não podem usar o SDK diretamente, considerar sidecars que injetam segredos como variáveis de ambiente ou arquivos montados, minimizando o risco de exposição.
*   **Variáveis de Ambiente (Último Recurso e Criptografado):** Se os segredos forem passados como variáveis de ambiente para o contêiner (evitar sempre que possível), eles devem ser injetados por um mecanismo seguro (e.g., Kubernetes Secrets criptografados com KMS) e nunca em texto plano.
*   **Auditoria de Acesso:** Habilitar o log de acesso no Secrets Manager para auditar quem acessou quais segredos e quando.

#### **3.2. Políticas de Acesso (IAM Roles for Service Accounts - IRSA)**
*   **IRSA no EKS:** Para cada Service Account Kubernetes que um microserviço utiliza, mapear um IAM Role da AWS que confere permissões específicas para acessar recursos da AWS (incluindo o Secrets Manager). Isso garante que apenas os pods autorizados possam interagir com os serviços da AWS.
*   **Políticas Granulares:** As políticas IAM associadas aos roles devem ser o mais restritivas possível, seguindo o princípio do menor privilégio.

#### **3.3. Rotação e Validade de Segredos**
*   **Rotação Automatizada:** Configurar a rotação automática de segredos no AWS Secrets Manager para credenciais de banco de dados e outras chaves de longa duração, reduzindo a janela de exposição em caso de comprometimento.
*   **Validade Limitada:** Tokens e credenciais de curta duração devem ser preferidos sempre que possível.

---

### **4. Conclusão: A Sintonia Perfeita**

Estas regras, quando aplicadas com rigor e inteligência, criam uma sinfonia de alto desempenho e segurança. Elas são a concretização da disciplina, garantindo que a base da nossa engenharia seja tão resiliente e implacável quanto a nossa missão financeira. A aderência a estas diretrizes não é opcional; é a fundação sobre a qual o Regenera Bank prosperará.
