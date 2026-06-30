# Guia de Deploy do Regenera Bank: Automatizando a Implantação de Microsserviços no EKS

**Autor:** Don Paulo Ricardo, PhD  
**Status:** Conceitual  
**Versão:** 1.0  
**Data:** 16 de dezembro de 2025  
**Objetivo:** Guiar a implantação completa do ecossistema Regenera Bank em AWS EKS.  
**Referência:** Blueprint Estratégico v1.0, Terraform Modules, Pipeline de CI/CD

---

### **1. Introdução: A Orquestração da Implantação**

Este guia conceitual detalha o processo de implantação do ecossistema de microsserviços do Regenera Bank em um cluster AWS EKS, utilizando Infrastructure as Code (IaC) com Terraform e automatizando o ciclo de vida da aplicação com uma pipeline de CI/CD. A implantação é um processo orquestrado que transforma o código em um sistema operacional resiliente, seguro e de alto desempenho.

---

### **2. Pré-requisitos para a Implantação**

Certifique-se de que os seguintes pré-requisitos estejam instalados e configurados em seu ambiente local:

*   **Conta AWS:** Com credenciais configuradas (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`).
*   **AWS CLI:** Ferramenta de linha de comando da AWS.
*   **Terraform:** CLI para provisionamento de infraestrutura (versão `~> 1.0`).
*   **kubectl:** CLI para gerenciamento de clusters Kubernetes.
*   **Helm:** Gerenciador de pacotes para Kubernetes.
*   **Docker:** Para construção e gerenciamento de imagens Docker.
*   **pnpm:** Gerenciador de pacotes para o monorepo.
*   **Git:** Para clonar o repositório.
*   **GitHub Account:** Acesso ao repositório do Regenera Bank e permissões para configurar GitHub Actions.

---

### **3. Estrutura do Processo de Deploy**

O processo de deploy é dividido em duas fases principais:

1.  **Provisionamento da Infraestrutura (Terraform):** Cria e configura todos os recursos de nuvem necessários (VPC, EKS, RDS, etc.).
2.  **Implantação da Aplicação (CI/CD via GitHub Actions):** Constrói, conteineriza e implanta os microsserviços no cluster EKS.

---

### **4. Fase 1: Provisionamento da Infraestrutura com Terraform**

Esta fase estabelece a fundação AWS onde o Regenera Bank operará.

#### **4.1. Configuração Inicial**
1.  **Clonar o Repositório:**
    ```bash
    git clone https://github.com/RegeneraBank/monorepo.git
    cd monorepo
    ```
2.  **Navegar para o Diretório Terraform:**
    ```bash
    cd ./infrastructure/terraform # Assumindo esta estrutura, ou './Regenera Bank Documents/Terraform' para os arquivos que criamos.
    ```
3.  **Configurar o Backend Remoto do Terraform:**
    *   Edite `versions.tf` para usar o `bucket` e `dynamodb_table` corretos para o estado do Terraform de Produção.
    *   Certifique-se de que estes recursos S3/DynamoDB existam e estejam configurados com as permissões apropriadas.

#### **4.2. Inicialização e Validação do Terraform**
1.  **Inicializar Terraform:** Baixa os provedores e inicializa o backend.
    ```bash
    terraform init
    ```
2.  **Validar a Configuração:** Verifica a sintaxe dos arquivos `.tf`.
    ```bash
    terraform validate
    ```
3.  **Revisar o Plano de Execução:** Gera um plano das mudanças que serão aplicadas. **Revise este plano cuidadosamente!**
    ```bash
    terraform plan -var-file="production.tfvars" # Usar um arquivo de variáveis para produção
    ```

#### **4.3. Aplicação das Mudanças (Provisionamento)**
1.  **Aplicar o Plano:** Procede com o provisionamento dos recursos AWS.
    ```bash
    terraform apply -var-file="production.tfvars"
    ```
    *   Confirme a aplicação digitando `yes` quando solicitado.

#### **4.4. Outputs Essenciais**
*   Após a aplicação, o Terraform exibirá outputs como o `eks_cluster_name`, `eks_cluster_endpoint`, `vpc_id`, etc. Guarde estas informações, pois serão necessárias.

---

### **5. Fase 2: Implantação da Aplicação com CI/CD (GitHub Actions)**

Esta fase orquestra o build e deploy dos microsserviços no cluster EKS.

#### **5.1. Conectar `kubectl` ao Cluster EKS**
1.  **Atualizar kubeconfig:** Use o AWS CLI para configurar seu `kubectl` para se comunicar com o novo cluster EKS.
    ```bash
    aws eks update-kubeconfig --name <eks_cluster_name_from_terraform_output> --region <aws_region>
    ```
2.  **Verificar Conexão:**
    ```bash
    kubectl get nodes
    ```

#### **5.2. Deploy de Componentes Base do Cluster (Manuais ou via Helm)**
*   **Istio Service Mesh:** Instale o Istio no cluster EKS usando `istioctl` ou o Helm chart oficial.
    ```bash
    istioctl install --set profile=default -y # Exemplo de instalação Istio
    kubectl apply -f ./Regenera\ Bank\ Documents/IaC\ \&\ Security/kubernetes/service-mesh/mesh-peer-authentication.yaml
    kubectl apply -f ./Regenera\ Bank\ Documents/IaC\ \&\ Security/kubernetes/service-mesh/user-service-destination-rule.yaml
    ```
*   **CSI Secrets Store Driver:** Instale o driver para integração com AWS Secrets Manager.
    ```bash
    helm install csi-secrets-store-provider-aws secrets-store-csi-driver/secrets-store-csi-driver-provider-aws --namespace kube-system
    ```
*   **Prometheus/Grafana/Alertmanager:** Instale sua stack de observabilidade.

#### **5.3. Configuração de Segredos no GitHub Actions**
1.  No repositório GitHub do Regenera Bank, navegue para `Settings > Secrets > Actions`.
2.  Adicione os seguintes secrets (entre outros):
    *   `AWS_ACCESS_KEY_ID`
    *   `AWS_SECRET_ACCESS_KEY`
    *   `EKS_CLUSTER_NAME_PRODUCTION` (o nome do cluster EKS provisionado pelo Terraform)

#### **5.4. Trigger da Pipeline CI/CD**
1.  **Push para `main`:** Qualquer push para o branch `main` ou a abertura de um Pull Request para `main` irá acionar a pipeline de CI/CD (`.github/workflows/main.yml`).
2.  **Monitorar a Execução:** Acompanhe a execução da pipeline na interface do GitHub Actions.

#### **5.5. Deploy dos Microsserviços**
*   A pipeline de CI/CD irá automaticamente:
    *   Detectar microsserviços modificados.
    *   Construir suas imagens Docker e enviá-las para o ECR.
    *   Implantar os microsserviços no cluster EKS, aplicando os manifestos Kubernetes (`user-service-k8s.yaml`) e atualizando as imagens dos deployments.

---

### **6. Verificação Pós-Deploy**

*   **Status dos Pods:**
    ```bash
    kubectl get pods -n <namespace>
    kubectl get deployments -n <namespace>
    ```
*   **Saúde dos Serviços:**
    ```bash
    kubectl get svc -n <namespace>
    ```
*   **Acesso ao Frontend:** Acessar o URL público do `next-frontend` para verificar a funcionalidade.
*   **Logs:** Verificar logs de aplicação para erros.
*   **Métricas:** Monitorar dashboards de performance e saúde (Grafana).

---

### **7. Limpeza (Opcional - Destruição da Infraestrutura)**

**CUIDADO:** Este comando irá destruir *toda* a infraestrutura provisionada pelo Terraform. Use-o apenas se tiver certeza.

```bash
cd ./infrastructure/terraform # Ou o diretório dos seus arquivos Terraform
terraform destroy -var-file="production.tfvars"
```

---

### **8. Conclusão: A Automação como Garantia de Excelência**

Este guia conceitual delineia o caminho para uma implantação automatizada, segura e eficiente do Regenera Bank. Ao seguir estes passos, garantimos que a nossa visão arquitetural se materialize em um sistema operacional de classe mundial, pronto para a regeneração financeira.
