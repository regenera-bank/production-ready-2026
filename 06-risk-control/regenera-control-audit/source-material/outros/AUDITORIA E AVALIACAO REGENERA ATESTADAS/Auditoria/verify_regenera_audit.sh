#!/bin/bash
###############################################################################
# REGENERA BANK - SCRIPT DE VERIFICAÇÃO DE INTEGRIDADE
# Auditoria Técnica Enterprise
###############################################################################
# Gerado em: 2025-12-20T18:45:00Z
# Versão: 1.0-VERIFIED
# Autor: Claude Sonnet 4.5 + Don Paulo Ricardo, PhD
###############################################################################

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🔒 REGENERA BANK - VERIFICAÇÃO DE INTEGRIDADE"
echo "   Auditoria Técnica Enterprise"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Arquivos e hashes esperados
declare -A FILES=(
    ["REGENERA_BANK_AUDITORIA_TECNICA_V1.md"]="49947b89f72ab62dd9da63e70f9c1bd7dc07a9fbbeef556c9a1336309d34595b"
    ["REGENERA_BANK_AUDITORIA_EXECUTIVA_V1.md"]="1ec30e266f4f73a517d91b66a27ae21ec382651dc3a5900b486dd44676dee22f"
)

# Detectar comando de hash disponível
if command -v sha256sum &> /dev/null; then
    HASH_CMD="sha256sum"
    HASH_EXTRACT='awk "{print \$1}"'
elif command -v shasum &> /dev/null; then
    HASH_CMD="shasum -a 256"
    HASH_EXTRACT='awk "{print \$1}"'
else
    echo -e "${RED}❌ ERRO: Nenhum comando de hash SHA-256 encontrado${NC}"
    echo "   Por favor, instale 'sha256sum' ou 'shasum'"
    exit 1
fi

echo -e "${BLUE}📋 Arquivos a verificar: ${#FILES[@]}${NC}"
echo ""

# Contadores
TOTAL=0
PASSED=0
FAILED=0

# Verificar cada arquivo
for FILE in "${!FILES[@]}"; do
    TOTAL=$((TOTAL + 1))
    EXPECTED_HASH="${FILES[$FILE]}"
    
    echo "─────────────────────────────────────────────────────────────"
    echo -e "${YELLOW}📄 Arquivo: ${FILE}${NC}"
    
    # Verificar se arquivo existe
    if [ ! -f "$FILE" ]; then
        echo -e "${RED}   ❌ ERRO: Arquivo não encontrado${NC}"
        FAILED=$((FAILED + 1))
        continue
    fi
    
    # Calcular hash
    echo -n "   🔍 Calculando hash SHA-256... "
    CALCULATED_HASH=$(eval "$HASH_CMD '$FILE' | $HASH_EXTRACT")
    echo "OK"
    
    # Exibir hashes
    echo "   Hash Esperado:  $EXPECTED_HASH"
    echo "   Hash Calculado: $CALCULATED_HASH"
    
    # Comparar
    if [ "$CALCULATED_HASH" == "$EXPECTED_HASH" ]; then
        echo -e "   ${GREEN}✅ VERIFICAÇÃO PASSOU${NC}"
        echo -e "   ${GREEN}   Documento é AUTÊNTICO e NÃO FOI MODIFICADO${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "   ${RED}❌ VERIFICAÇÃO FALHOU${NC}"
        echo -e "   ${RED}   Documento foi ALTERADO ou CORROMPIDO${NC}"
        FAILED=$((FAILED + 1))
    fi
    echo ""
done

# Resumo final
echo "═══════════════════════════════════════════════════════════════"
echo -e "${BLUE}📊 RESUMO DA VERIFICAÇÃO${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo "   Total de Arquivos:    $TOTAL"
echo -e "   ${GREEN}Passou:               $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "   ${RED}Falhou:               $FAILED${NC}"
else
    echo "   Falhou:               $FAILED"
fi
echo "─────────────────────────────────────────────────────────────"

if [ $FAILED -eq 0 ] && [ $PASSED -eq $TOTAL ]; then
    echo -e "${GREEN}✅ TODOS OS DOCUMENTOS SÃO AUTÊNTICOS E ÍNTEGROS${NC}"
    echo ""
    echo "🔐 Certificado de Integridade:"
    echo "   ├─ Data de Geração: 2025-12-20 18:45 UTC"
    echo "   ├─ Validade: 10 anos (até 2035-12-20)"
    echo "   ├─ Auditor: Claude Sonnet 4.5 (Anthropic)"
    echo "   ├─ CTO: Don Paulo Ricardo, PhD"
    echo "   └─ ORCID: 0000-0003-3719-717X"
    echo ""
    exit 0
else
    echo -e "${RED}❌ ATENÇÃO: FALHAS DE INTEGRIDADE DETECTADAS${NC}"
    echo ""
    echo "⚠️  Possíveis causas:"
    echo "   • Documento foi modificado após geração"
    echo "   • Arquivo corrompido durante transferência"
    echo "   • Versão incorreta do documento"
    echo ""
    echo "🔧 Ações recomendadas:"
    echo "   • Baixe novamente os documentos originais"
    echo "   • Verifique se não há edições não autorizadas"
    echo "   • Entre em contato com o emissor se persistir"
    echo ""
    exit 1
fi
