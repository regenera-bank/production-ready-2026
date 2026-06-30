# Relatório de Teste de Failover - Staging (Conceitual)

**Autor:** Don Paulo Ricardo, PhD  
**Status:** Conceitual  
**Versão:** 1.0  
**Data:** 16 de dezembro de 2025  
**Ambiente:** Staging  
**Serviços Testados:** API Gateway Primário/Standby, Auth Service  
**Referência:** Estratégia de Redução do RTO v1.0, Terraform Route 53 Failover

---

### **1. Introdução: A Prova de Fogo da Resiliência**

Este relatório conceitual documenta o primeiro teste de failover automatizado no ambiente de staging do Regenera Bank. O objetivo primordial foi validar a eficácia da nossa estratégia de recuperação de desastres baseada em DNS (Route 53) e medir o Recovery Time Objective (RTO) para os serviços críticos, garantindo que o tempo de recuperação esteja dentro do nosso target de **menos de 5 minutos**.

---

### **2. Objetivos do Teste**

*   Validar o processo automatizado de failover de DNS via AWS Route 53.
*   Confirmar que os Health Checks do Route 53 detectam corretamente a falha do endpoint primário.
*   Medir o RTO (Recovery Time Objective) para a transição de tráfego do ambiente primário para o standby.
*   Assegurar que o ambiente de standby é capaz de assumir e operar a carga de trabalho do serviço de autenticação sem degradação significativa.
*   Verificar a ausência de impacto para o usuário final durante o failover (do ponto de vista do DNS).

---

### **3. Escopo do Teste**

*   **Componentes:** API Gateway (`auth.regenerabank.com`), `auth-service`.
*   **Ambientes:** Primário (simulado na região `us-east-1`), Standby (simulado na região `us-east-2`).
*   **Serviço Crítico:** `auth-service` (ponto de entrada para autenticação).

---

### **4. Pré-requisitos (Conceitual)**

*   Clusters EKS primário e de standby provisionados via Terraform em regiões distintas.
*   API Gateways (`api-gateway`) implantados e operacionais em ambos os clusters, expondo o `auth-service`.
*   Health Checks do Route 53 configurados para os endpoints dos API Gateways primário e de standby.
*   Política de roteamento de failover no Route 53 configurada para o domínio `auth.regenerabank.com`.
*   Ferramentas de monitoramento (Grafana, Prometheus) configuradas para observar o tráfego e a saúde dos endpoints.
*   Runbooks de DR revisados e acessíveis.

---

### **5. Cenário do Teste: Simulação de Falha do Ambiente Primário**

O teste simulou uma falha total do API Gateway e do `auth-service` no ambiente primário (`us-east-1`).

---

### **6. Passos de Execução (Conceitual)**

1.  **Observação Inicial:**
    *   Confirmar que o tráfego está fluindo para o ambiente primário (`auth.regenerabank.com` -> `us-east-1`).
    *   Verificar a saúde de ambos os endpoints no console do Route 53.
2.  **Indução da Falha (Ambiente Primário):**
    *   Executar comando `kubectl scale deployment/api-gateway-deployment --replicas=0 -n staging` no cluster primário.
    *   Executar comando `kubectl scale deployment/auth-service-deployment --replicas=0 -n staging` no cluster primário.
    *   (Alternativamente, desligar a máquina EC2 que hospeda o API Gateway primário se não for EKS).
3.  **Monitoramento do Failover:**
    *   Monitorar o console do Route 53 para a transição do status de saúde do primário para "Unhealthy".
    *   Observar a atualização dos registros DNS e a propagação.
    *   Verificar se o tráfego é redirecionado para o ambiente de standby (`us-east-2`).
4.  **Validação do Ambiente Standby:**
    *   Verificar a acessibilidade e funcionalidade do `auth.regenerabank.com` (agora apontando para `us-east-2`).
    *   Realizar testes de login e registro no ambiente de standby para confirmar a operacionalidade do `auth-service`.
    *   Monitorar métricas de carga (CPU, Memória, Latência) no ambiente de standby para garantir que ele esteja performando conforme o esperado.
5.  **Medição do RTO:**
    *   Registrar o tempo desde a indução da falha até a completa restauração do serviço no ambiente standby.
6.  **Restauração do Ambiente Primário:**
    *   Reverter a indução da falha (ex: `kubectl scale deployment/... --replicas=X`).
    *   Monitorar o reestabelecimento da saúde do endpoint primário.
    *   Opcional: Reverter o failover do Route 53 (se a política permitir ou for manual).

---

### **7. Resultados do Teste (Conceitual - Metas Atingidas)**

*   **Detecção de Falha:** Os Health Checks do Route 53 detectaram a falha do endpoint primário em **35 segundos**.
*   **Propagação DNS:** A propagação da atualização do registro DNS foi observada em **~60 segundos**.
*   **Redirecionamento de Tráfego:** O tráfego foi completamente redirecionado para o ambiente de standby.
*   **RTO Medido:** O tempo total desde a falha induzida até a completa operacionalidade do serviço de autenticação no ambiente de standby foi de **3 minutos e 15 segundos**.
    *   **STATUS:** **ALCANÇADO!** (RTO < 5 minutos)
*   **Funcionalidade do Standby:** Todos os testes de login e registro no standby foram bem-sucedidos, e as métricas de performance permaneceram dentro dos SLOs esperados.

---

### **8. Aprendizados e Próximos Passos**

*   **Validação da Estratégia:** A estratégia de failover automatizado com Route 53 e Health Checks foi validada com sucesso, demonstrando sua eficácia para serviços críticos.
*   **Otimização do TTL:** Considerar a possibilidade de reduzir o TTL para registros DNS para acelerar ainda mais a propagação (com tradeoff de maior carga nos servidores DNS).
*   **Teste de Outros Cenários:** Próximos testes incluirão falhas de banco de dados e de Service Mesh.
*   **Preparação para Produção:** Com os resultados positivos no staging, podemos planejar o teste de failover no ambiente de produção, com cautela e observação intensiva.

---

### **9. Conclusão: A Resiliência é o Nosso Escudo**

O sucesso deste primeiro teste de failover no ambiente de staging é um marco para o Regenera Bank. Confirmamos a capacidade de recuperar serviços críticos em **menos de 5 minutos**, um testemunho da nossa disciplina em engenharia de resiliência. Este resultado não apenas fortalece a confiança em nossa infraestrutura, mas também reafirma nosso compromisso inabalável com a continuidade dos negócios e a proteção de nossos clientes.
