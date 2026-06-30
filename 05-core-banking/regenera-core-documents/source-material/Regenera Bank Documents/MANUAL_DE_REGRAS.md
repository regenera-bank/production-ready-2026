# Manual de Regras de Engenharia: Disciplina Implacável para o Regenera Bank

**Autor:** Don Paulo Ricardo, PhD  
**Status:** Confidencial  
**Versão:** 1.0  
**Data:** 16 de dezembro de 2025

---

### **1. Introdução: A Disciplina da Excelência**

Este Manual de Regras de Engenharia serve como o pilar da nossa disciplina técnica. No Regenera Bank, a excelência não é um objetivo; é a nossa condição de existência. Cada linha de código, cada decisão arquitetural e cada processo de implantação são regidos por estes princípios, garantindo a consistência, a qualidade, a segurança e a manutenibilidade que um ecossistema financeiro de nossa magnitude exige. Este não é um documento estático, mas uma doutrina viva, sujeita a refinamento contínuo, mas cujos princípios são inegociáveis.

---

### **2. Princípios Fundamentais: Reflexo do Blueprint Estratégico**

As regras detalhadas abaixo são a manifestação prática dos nossos Princípios Arquiteturais. Elas garantem que a visão estratégica seja traduzida em ação concreta e padronizada.

*   **Domínios Desacoplados, Responsabilidades Claras:** Reflete-se na estrutura do monorepo, na autonomia dos serviços e nos contratos de comunicação.
*   **Segurança em Camadas:** É a base para todas as práticas de codificação, revisão e implantação.
*   **Observabilidade Total por Design:** Impõe a instrumentação intrínseca de cada componente.
*   **Automação Implacável:** Eleva a pipeline de CI/CD ao status de espinha dorsal do ciclo de vida do desenvolvimento.

---

### **3. Regras de Desenvolvimento: A Arte da Construção Impecável**

#### **3.1. Padrões de Codificação (TypeScript/Node.js/React)**

1.  **Linguagem:** TypeScript é a linguagem oficial para todos os novos desenvolvimentos de backend e frontend. JavaScript puro é tolerado apenas em cenários legados ou de configuração estrita.
2.  **Formatação e Estilo:**
    *   Todos os projetos devem usar `ESLint` e `Prettier` com as configurações padronizadas do monorepo. Formatação é automatizada no commit via `lint-staged` e `husky`.
    *   Nomenclatura:
        *   Variáveis e Funções: `camelCase` (ex: `minhaVariavel`, `calcularTotal`).
        *   Classes e Componentes: `PascalCase` (ex: `MinhaClasse`, `MeuComponente`).
        *   Arquivos e Pastas: `kebab-case` (ex: `minha-pasta/meu-arquivo.ts`).
        *   Constantes Globais: `SCREAMING_SNAKE_CASE` (ex: `API_BASE_URL`).
3.  **Estrutura de Código:**
    *   **Backend (NestJS):** Seguir a estrutura modular padrão do NestJS (modules, controllers, services, entities, dtos).
    *   **Frontend (Next.js/React):** Componentes devem ser pequenos e focados. Lógica de negócio em hooks personalizados ou contextos.
4.  **Tratamento de Erros:** Exceções devem ser capturadas e tratadas de forma elegante, com logs adequados. Nunca expor detalhes internos de erro ao cliente.
5.  **Assincronia:** Preferir `async/await` para operações assíncronas.

#### **3.2. Revisão de Código (Code Review): A Guarda da Qualidade**

1.  **Obrigatório:** Todo Pull Request (PR) deve ser revisado e aprovado por, no mínimo, dois engenheiros com experiência relevante no domínio do código.
2.  **Foco da Revisão:**
    *   **Funcionalidade:** O código resolve o problema proposto?
    *   **Segurança:** Há vulnerabilidades introduzidas? Segredos são expostos?
    *   **Performance:** O código é eficiente? Há operações custosas?
    *   **Consistência:** O código adere aos padrões e princípios arquiteturais?
    *   **Testes:** Os testes são adequados e cobrem os cenários críticos?
    *   **Clareza:** O código é legível e auto-documentado?

#### **3.3. Padrões de Teste: A Verificação da Verdade**

1.  **Testes de Unidade:** Cobertura mínima de 80% para a lógica de negócio crítica (services, helpers). Utilizar frameworks como `Jest`.
2.  **Testes de Integração:** Validar a comunicação e interação entre os componentes internos de um serviço (ex: service e repository) e a integração entre microserviços.
3.  **Testes E2E (End-to-End):** Utilizar `Cypress` para validar os fluxos de usuário críticos, simulando a interação completa com o frontend e o backend.
4.  **Testes de Contrato:** Para todas as APIs gRPC e REST públicas entre microserviços, implementar testes de contrato para garantir que as alterações em um serviço não quebrem os clientes (e.g., Pact, Protobuf validation).

#### **3.4. Mensagens de Commit: A História Imutável do Código**

1.  **Padrão:** Todos os commits devem seguir o padrão `Conventional Commits`.
    *   `type(scope): subject`
    *   Exemplos: `feat(auth): adicionar autenticação com gRPC`, `fix(payment): corrigir cálculo de juros`, `chore(deps): atualizar pnpm-lockfile`.
2.  **Significado:** Mensagens claras e concisas que descrevam *o quê* e *porquê* da mudança, não *como*.

#### **3.5. Documentação: O Conhecimento Compartilhado**

1.  **`README.md`:** Cada pacote (`packages/*`) e microserviço (`apps/services/*`) deve conter um `README.md` detalhado, explicando seu propósito, como rodar localmente e como testar.
2.  **APIs:**
    *   **REST:** Utilizar **Swagger/OpenAPI** para documentar automaticamente os endpoints e modelos de dados.
    *   **gRPC:** Os arquivos `.proto` em `packages/grpc-definitions` são a fonte única da verdade para a documentação das APIs gRPC.
3.  **Comentários de Código:** Usar comentários para explicar decisões de design complexas, justificativas para soluções não óbvias ou "porquês" importantes, e não para descrever o óbvio.

---

### **4. Regras de Operação e Segurança: A Resiliência em Campo**

#### **4.1. CI/CD e Implantação:**

1.  **Automação Exclusiva:** Todas as implantações em ambientes de Staging e Produção devem ocorrer exclusivamente através da pipeline de CI/CD do GitHub Actions. **Nenhuma alteração manual é permitida em Produção.**
2.  **"Golden Image":** A imagem Docker construída pela CI/CD para um determinado commit é a "golden image" e deve ser usada em todos os ambientes subsequentes (staging, produção) para aquele commit.
3.  **Rollback Rápido:** Projetar deploys para serem facilmente revertidos. O `kubectl rollout undo` é um aliado.

#### **4.2. Gestão de Segredos:**

1.  **Proibição Absoluta:** Segredos (chaves de API, credenciais de banco de dados, tokens) **nunca** devem ser hardcoded ou armazenados em arquivos de configuração versionados no Git.
2.  **Centralização:** Todos os segredos devem ser gerenciados por **AWS Secrets Manager** ou solução similar, e injetados de forma segura nos contêineres em tempo de execução.
3.  **Rotação:** Implementar políticas de rotação de segredos quando aplicável.

#### **4.3. Monitoramento e Alerta:**

1.  **Instrumentação Obrigatória:** Todos os microserviços devem ser instrumentados com métricas (Prometheus), logs (Loki/Elasticsearch) e traces (Jaeger/OpenTelemetry) para garantir visibilidade completa do sistema em tempo real.
2.  **Alertas Proativos:** Configurar alertas proativos para anomalias, erros e degradação de performance nos serviços críticos.

#### **4.4. Gerenciamento de Logs:**

1.  **Centralização:** Todos os logs de aplicação devem ser centralizados em uma plataforma (e.g., ELK Stack, Grafana Loki) para análise, depuração e auditoria.
2.  **Formato Padronizado:** Logs devem seguir um formato estruturado (e.g., JSON) para facilitar a parseabilidade e a busca.

---

### **5. Gerenciamento de Dependências**

1.  **`pnpm`:** O `pnpm` é a ferramenta padrão para gerenciamento de pacotes e dependências em todo o monorepo, garantindo eficiência de espaço em disco e performance.
2.  **`lockfile`:** O `pnpm-lock.yaml` deve ser sempre versionado e respeitado (`--frozen-lockfile` na CI/CD) para garantir builds reprodutíveis.
3.  **Atualizações:** As dependências devem ser atualizadas regularmente, com um processo definido para validação e testes para evitar regressões.

---

### **6. Conclusão: A Implacabilidade do Padrão**

Este Manual de Regras não é uma lista arbitrária de imposições, mas o destilado da experiência em engenharia de sistemas complexos. A adesão a estas regras é um compromisso com a excelência, a segurança e a resiliência do Regenera Bank. A disciplina implacável na aplicação destes padrões é o que nos distinguirá e nos permitirá construir o futuro da regeneração financeira.
