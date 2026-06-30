#!/bin/bash
###############################################################################
# REGENERA BANK - BLOCKCHAIN CERTIFICATE SETUP
# Script de configuração automatizada com assistente interativo
###############################################################################
# Autor: Don Paulo Ricardo, PhD
# ORCID: 0000-0003-3719-717X
# Data: 21 de Dezembro de 2025
###############################################################################

set -e  # Exit on error

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Símbolos
CHECK="${GREEN}✓${NC}"
CROSS="${RED}✗${NC}"
INFO="${BLUE}ℹ${NC}"
WARN="${YELLOW}⚠${NC}"

###############################################################################
# FUNÇÕES AUXILIARES
###############################################################################

print_header() {
    echo -e "\n${PURPLE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}\n"
}

print_step() {
    echo -e "${CYAN}▶${NC} $1"
}

print_success() {
    echo -e "${CHECK} $1"
}

print_error() {
    echo -e "${CROSS} $1"
}

print_warning() {
    echo -e "${WARN} $1"
}

print_info() {
    echo -e "${INFO} $1"
}

check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 está instalado ($(command -v $1))"
        return 0
    else
        print_error "$1 NÃO está instalado"
        return 1
    fi
}

###############################################################################
# MAIN SETUP
###############################################################################

clear

print_header "🚀 REGENERA BANK - BLOCKCHAIN CERTIFICATE SETUP"

echo -e "${BLUE}Este script irá configurar todo o ambiente necessário para o${NC}"
echo -e "${BLUE}Sistema de Certificação Blockchain do Regenera Bank.${NC}"
echo -e "\n${YELLOW}Tempo estimado: 10-15 minutos${NC}\n"

read -p "Pressione ENTER para continuar ou Ctrl+C para cancelar..."

###############################################################################
# STEP 1: VERIFICAR PRÉ-REQUISITOS
###############################################################################

print_header "STEP 1/7: Verificando Pré-requisitos"

print_step "Verificando Node.js..."
if check_command node; then
    NODE_VERSION=$(node --version)
    echo -e "   Versão: ${GREEN}$NODE_VERSION${NC}"
    
    # Verificar se é v18+
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        print_warning "Node.js v18+ é recomendado. Atual: $NODE_VERSION"
        echo -e "   ${BLUE}Instalar NVM e Node v18:${NC}"
        echo -e "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
        echo -e "   nvm install 18 && nvm use 18"
    fi
else
    print_error "Node.js não encontrado!"
    echo -e "\n${YELLOW}Instalação recomendada (via NVM):${NC}"
    echo -e "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo -e "nvm install 18"
    echo -e "nvm use 18"
    exit 1
fi

print_step "Verificando npm..."
check_command npm || exit 1

print_step "Verificando git..."
check_command git || exit 1

print_step "Verificando curl..."
check_command curl || exit 1

print_success "Todos os pré-requisitos estão instalados!"

###############################################################################
# STEP 2: CRIAR ESTRUTURA DE DIRETÓRIOS
###############################################################################

print_header "STEP 2/7: Criando Estrutura de Diretórios"

mkdir -p contracts
mkdir -p scripts
mkdir -p test
mkdir -p output
mkdir -p .github/workflows

print_success "Estrutura de diretórios criada"

###############################################################################
# STEP 3: INSTALAR DEPENDÊNCIAS
###############################################################################

print_header "STEP 3/7: Instalando Dependências"

if [ ! -f "package.json" ]; then
    print_error "package.json não encontrado!"
    print_info "Certifique-se de que todos os arquivos foram baixados corretamente"
    exit 1
fi

print_step "Instalando dependências via npm..."
npm install

print_success "Dependências instaladas com sucesso"

###############################################################################
# STEP 4: CONFIGURAR VARIÁVEIS DE AMBIENTE
###############################################################################

print_header "STEP 4/7: Configurando Variáveis de Ambiente"

if [ -f ".env" ]; then
    print_warning ".env já existe. Deseja sobrescrever? (s/N)"
    read -r response
    if [[ ! "$response" =~ ^([sS][iI][mM]|[sS])$ ]]; then
        print_info "Mantendo .env existente"
    else
        cp .env.example .env
        print_success ".env criado a partir de .env.example"
    fi
else
    cp .env.example .env
    print_success ".env criado a partir de .env.example"
fi

print_info "\n${YELLOW}IMPORTANTE:${NC} Você precisa editar o arquivo .env com suas credenciais"
print_info "Abra o arquivo .env em um editor de texto e preencha:"
print_info "  • POLYGON_RPC_URL (obter em Infura.io ou Alchemy)"
print_info "  • PRIVATE_KEY (sua wallet - NUNCA compartilhe!)"
print_info "  • POLYGONSCAN_API_KEY (obter em Polygonscan.com)"
print_info "  • PINATA_API_KEY e PINATA_SECRET_KEY (obter em Pinata.cloud)"

echo -e "\n${CYAN}Deseja abrir o .env agora para edição? (s/N)${NC}"
read -r response
if [[ "$response" =~ ^([sS][iI][mM]|[sS])$ ]]; then
    if command -v nano &> /dev/null; then
        nano .env
    elif command -v vim &> /dev/null; then
        vim .env
    elif command -v vi &> /dev/null; then
        vi .env
    else
        print_warning "Nenhum editor de texto encontrado. Abra .env manualmente"
        print_info "Comando: nano .env  OU  vim .env  OU  code .env"
    fi
fi

###############################################################################
# STEP 5: COMPILAR CONTRATOS
###############################################################################

print_header "STEP 5/7: Compilando Smart Contracts"

if [ ! -f "hardhat.config.js" ]; then
    print_error "hardhat.config.js não encontrado!"
    exit 1
fi

print_step "Compilando contratos Solidity..."
npx hardhat compile

if [ $? -eq 0 ]; then
    print_success "Contratos compilados com sucesso"
else
    print_error "Falha na compilação dos contratos"
    exit 1
fi

###############################################################################
# STEP 6: EXECUTAR TESTES
###############################################################################

print_header "STEP 6/7: Executando Testes (Opcional)"

echo -e "${CYAN}Deseja executar os testes? (s/N)${NC}"
read -r response
if [[ "$response" =~ ^([sS][iI][mM]|[sS])$ ]]; then
    print_step "Executando suite de testes..."
    npm run test
    
    if [ $? -eq 0 ]; then
        print_success "Todos os testes passaram!"
    else
        print_warning "Alguns testes falharam. Verifique os logs acima"
    fi
else
    print_info "Testes pulados (você pode executar depois com: npm run test)"
fi

###############################################################################
# STEP 7: RESUMO E PRÓXIMOS PASSOS
###############################################################################

print_header "STEP 7/7: Setup Concluído!"

print_success "Ambiente configurado com sucesso!"

echo -e "\n${PURPLE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}                    PRÓXIMOS PASSOS${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}1. Configurar credenciais no .env${NC}"
echo -e "   ${BLUE}nano .env${NC}"
echo -e "   Preencha todas as variáveis marcadas com YOUR_*\n"

echo -e "${YELLOW}2. Adicionar MATIC à sua wallet${NC}"
echo -e "   ${BLUE}Você precisa de ~0.1 MATIC (~\$0.10 USD)${NC}"
echo -e "   Comprar em: https://quickswap.exchange"
echo -e "   Ou usar faucet (testnet): https://faucet.polygon.technology/\n"

echo -e "${YELLOW}3. Testar no Testnet primeiro (RECOMENDADO)${NC}"
echo -e "   ${BLUE}npm run blockchain:deploy:testnet${NC}"
echo -e "   Isso usa Mumbai testnet (MATIC gratuito)\n"

echo -e "${YELLOW}4. Deploy em produção${NC}"
echo -e "   ${BLUE}npm run deploy:immortality${NC}"
echo -e "   Isso faz TUDO: deploy + IPFS + badges + verificação\n"

echo -e "${YELLOW}5. Verificar tudo${NC}"
echo -e "   ${BLUE}npm run verify:all${NC}"
echo -e "   Confirma que tudo está correto\n"

echo -e "${YELLOW}6. Gerar badge HTML${NC}"
echo -e "   ${BLUE}npm run badge:generate${NC}"
echo -e "   Cria badge visual para compartilhar\n"

echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}                    RECURSOS ÚTEIS${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}\n"

echo -e "📚 ${CYAN}Documentação:${NC}"
echo -e "   README_BLOCKCHAIN_CERTIFICATE.md - Guia completo"
echo -e "   regenera_quick_start.txt - Quick start de 30 minutos\n"

echo -e "🔗 ${CYAN}Links Importantes:${NC}"
echo -e "   Infura (RPC): https://infura.io"
echo -e "   Pinata (IPFS): https://pinata.cloud"
echo -e "   Polygonscan: https://polygonscan.com"
echo -e "   Polygon Faucet: https://faucet.polygon.technology/\n"

echo -e "❓ ${CYAN}Suporte:${NC}"
echo -e "   Email: don.paulo@regenerabank.com"
echo -e "   ORCID: 0000-0003-3719-717X\n"

echo -e "${GREEN}✨ Setup concluído! Boa sorte com o deployment! ✨${NC}\n"

###############################################################################
# CHECKLIST FINAL
###############################################################################

echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}                  CHECKLIST DE SETUP${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}\n"

CHECKLIST=(
    "Node.js v18+ instalado"
    "npm instalado"
    "git instalado"
    "Dependências npm instaladas"
    "Contratos Solidity compilados"
    ".env criado"
)

for item in "${CHECKLIST[@]}"; do
    print_success "$item"
done

echo -e "\n${YELLOW}AINDA FALTA:${NC}"
echo -e "${WARN} Configurar credenciais no .env"
echo -e "${WARN} Adicionar MATIC à wallet"
echo -e "${WARN} Executar deployment\n"

print_info "Execute ${CYAN}npm run help${NC} para ver todos os comandos disponíveis"

echo ""
