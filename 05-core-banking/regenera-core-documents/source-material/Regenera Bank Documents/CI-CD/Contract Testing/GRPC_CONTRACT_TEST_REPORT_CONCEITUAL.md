# Relatório de Testes de Contrato (gRPC/Protobuf) - Conceitual

**Autor:** Don Paulo Ricardo, PhD  
**Status:** Conceitual  
**Versão:** 1.0  
**Data:** 16 de dezembro de 2025  
**Serviços Envolvidos:** `auth-service` (Cliente), `user-service` (Servidor)  
**Referência:** Blueprint Estratégico v1.0 (Fase 2, Item 2), Manual de Regras de Engenharia v1.0 (Regra 3.3.4)

---

### **1. Introdução: A Governança do Contrato entre Microserviços**

Em uma arquitetura de microserviços, onde múltiplos serviços se comunicam de forma distribuída, a garantia de que as interfaces de comunicação permaneçam compatíveis é fundamental. Testes de contrato são a nossa linha de defesa contra "breaking changes" indesejados. Este relatório conceitual demonstra como a validação do contrato gRPC/Protobuf entre o `auth-service` (cliente) e o `user-service` (servidor) seria apresentada, garantindo a Regra 3.3.4 do nosso Manual de Regras de Engenharia e validando a robustez da comunicação via Service Mesh (Istio).

---

### **2. Metodologia de Teste de Contrato gRPC/Protobuf**

A metodologia proposta segue um modelo Consumer-Driven Contract (CDC), onde o cliente (`auth-service`) define suas expectativas do contrato, e o servidor (`user-service`) valida se essas expectativas são atendidas.

*   **Definição do Contrato:** O contrato é formalizado pelo arquivo `.proto` (e.g., `user.proto`).
*   **Geração de Stubs/Mocks:** O `auth-service` gera stubs de cliente a partir do `.proto` e mocks do servidor para seus testes unitários.
*   **Criação do Contrato do Consumidor:** O `auth-service` cria um "pacto" (Pact) ou similar, descrevendo suas interações esperadas com o `user-service`.
*   **Verificação do Provedor:** O `user-service` executa os testes de verificação do "pacto" do consumidor como parte de sua pipeline de CI/CD.

**Ferramentas Sugeridas:**
*   **Pact for gRPC:** Uma extensão da ferramenta Pact para validar contratos gRPC.
*   **gRPCurl / grpcc:** Ferramentas CLI para interagir e testar serviços gRPC manualmente ou em scripts.
*   **Custom Test Framework:** Frameworks de teste que utilizam os arquivos `.proto` para gerar e validar requisições/respostas.

---

### **3. Estrutura Conceitual do Relatório de Testes de Contrato**

Este relatório seria um artefato gerado automaticamente pela pipeline de CI/CD após cada execução bem-sucedida dos testes de verificação de contrato.

#### **3.1. Visão Geral do Relatório**

*   **Título:** Relatório de Testes de Contrato gRPC (auth-service <-> user-service)
*   **Data de Geração:** `[Timestamp Automático]`
*   **Versão do Cliente (`auth-service`):** `[Git SHA / Versão do Artefato]`
*   **Versão do Servidor (`user-service`):** `[Git SHA / Versão do Artefato]`
*   **Status Geral:** **APROVADO** / **FALHOU**
*   **Resumo:** `X` interações testadas, `Y` falhas.

#### **3.2. Detalhes das Interações (Exemplo)**

| Interação ID | Cliente           | Servidor          | Método RPC         | Requisição (Exemplo)               | Resposta (Exemplo)              | Status    | Detalhes da Falha                                 |
| :----------- | :---------------- | :---------------- | :----------------- | :--------------------------------- | :------------------------------ | :-------- | :------------------------------------------------ |
| `001`        | `auth-service`    | `user-service`    | `FindOneByEmail`   | `{ email: "teste@email.com" }`     | `{ id: "uuid", email: "...", passwordHash: "..." }` | `APROVADO` | -                                                 |
| `002`        | `auth-service`    | `user-service`    | `FindOneByEmail`   | `{ email: "naoexiste@email.com" }` | `(gRPC Status: NOT_FOUND)`      | `APROVADO` | -                                                 |
| `003`        | `auth-service`    | `user-service`    | `CreateUser`       | `{ email: "novo@email.com", ... }` | `{ id: "novo-uuid", email: "...", ... }` | `APROVADO` | -                                                 |
| `004`        | `auth-service`    | `user-service`    | `FindOneByEmail`   | `{ email: "invalido" }`            | `(gRPC Status: INVALID_ARGUMENT)` | `APROVADO` | -                                                 |

#### **3.3. Logs de Execução (Exemplo)**

```
[2025-12-16 10:30:01] INFO: Pact verification initiated for user-service.
[2025-12-16 10:30:05] INFO: Verifying pact: auth-service-user-service.json
[2025-12-16 10:30:08] INFO: Interaction 'should return a user by email' PASSED.
[2025-12-16 10:30:12] INFO: Interaction 'should return NOT_FOUND for non-existent email' PASSED.
[2025-12-16 10:30:15] INFO: Interaction 'should create a new user' PASSED.
[2025-12-16 10:30:17] INFO: Pact verification completed. All 4 interactions passed.
[2025-12-16 10:30:17] INFO: Report generated successfully.
```

---

### **4. Validação da Implementação e Conformidade**

Este relatório de testes de contrato seria a prova concreta de que:

*   **A correção da anomalia gRPC é bem-sucedida:** A comunicação entre `auth-service` e `user-service` via gRPC funciona conforme o esperado pelo cliente.
*   **A implementação do Istio é validada:** Embora o Istio garanta o transporte (mTLS, resiliência), os testes de contrato confirmam que a *semântica* da comunicação de aplicação-para-aplicação é preservada dentro da Service Mesh.
*   **A Regra 3.3.4 (Testes de Contrato) está sendo aplicada:** Demonstra o compromisso com a qualidade e a prevenção de quebras na comunicação entre serviços, um pilar da nossa arquitetura de microserviços.

---

### **5. Conclusão: A Garantia da Integridade**

Testes de contrato são a espinha dorsal da integridade em um ambiente de microserviços. Este relatório conceitual ilustra como manteremos a disciplina e a confiança nas nossas interfaces gRPC, garantindo a estabilidade e a evolução contínua do ecossistema Regenera Bank com a máxima confiança.
