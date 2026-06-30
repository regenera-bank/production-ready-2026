# Regenera Bank - Script de Verificação de Integridade (PowerShell)
# Gerado em: 2025-12-17T01:30:00Z

Write-Host "🔒 VERIFICAÇÃO DE INTEGRIDADE - REGENERA BANK" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

$PdfFile = "Regenera_Bank_Analise_Completa_10-10_VERIFIED.pdf"
$ExpectedHash = "90df3ac523a5322dab458fbc1d4e2619e693c4c194edfbab74317b6e13d6b31c".ToUpper()

Write-Host "📄 Documento: $PdfFile"
Write-Host "🔍 Calculando hash SHA-256..."
Write-Host ""

try {
    $FileHash = Get-FileHash -Path $PdfFile -Algorithm SHA256
    $CalculatedHash = $FileHash.Hash
    
    Write-Host "Hash Calculado: $CalculatedHash"
    Write-Host "Hash Esperado:  $ExpectedHash"
    Write-Host ""
    
    if ($CalculatedHash -eq $ExpectedHash) {
        Write-Host "✅ VERIFICAÇÃO PASSOU" -ForegroundColor Green
        Write-Host "O documento é AUTÊNTICO e NÃO FOI MODIFICADO" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "❌ VERIFICAÇÃO FALHOU" -ForegroundColor Red
        Write-Host "O documento foi ALTERADO ou CORROMPIDO" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro ao calcular hash: $_" -ForegroundColor Red
    exit 1
}
