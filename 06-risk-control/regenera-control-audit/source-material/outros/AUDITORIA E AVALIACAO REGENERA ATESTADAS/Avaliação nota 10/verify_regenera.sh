#!/bin/bash
# Regenera Bank - Script de Verificação de Integridade
# Gerado em: 2025-12-17T01:30:00Z

echo "🔒 VERIFICAÇÃO DE INTEGRIDADE - REGENERA BANK"
echo "=============================================="
echo ""

PDF_FILE="Regenera_Bank_Analise_Completa_10-10_VERIFIED.pdf"
EXPECTED_HASH="90df3ac523a5322dab458fbc1d4e2619e693c4c194edfbab74317b6e13d6b31c"

echo "📄 Documento: $PDF_FILE"
echo "🔍 Calculando hash SHA-256..."
echo ""

if command -v sha256sum &> /dev/null; then
    CALCULATED_HASH=$(sha256sum "$PDF_FILE" | awk '{print $1}')
elif command -v shasum &> /dev/null; then
    CALCULATED_HASH=$(shasum -a 256 "$PDF_FILE" | awk '{print $1}')
else
    echo "❌ Erro: sha256sum ou shasum não encontrado"
    exit 1
fi

echo "Hash Calculado: $CALCULATED_HASH"
echo "Hash Esperado:  $EXPECTED_HASH"
echo ""

if [ "$CALCULATED_HASH" == "$EXPECTED_HASH" ]; then
    echo "✅ VERIFICAÇÃO PASSOU"
    echo "O documento é AUTÊNTICO e NÃO FOI MODIFICADO"
    exit 0
else
    echo "❌ VERIFICAÇÃO FALHOU"
    echo "O documento foi ALTERADO ou CORROMPIDO"
    exit 1
fi
