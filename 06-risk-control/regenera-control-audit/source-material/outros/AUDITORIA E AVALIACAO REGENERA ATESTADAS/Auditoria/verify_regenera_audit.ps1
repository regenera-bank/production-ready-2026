###############################################################################
# REGENERA BANK - SCRIPT DE VERIFICAÇÃO DE INTEGRIDADE (PowerShell)
# Auditoria Técnica Enterprise
###############################################################################
# Gerado em: 2025-12-20T18:45:00Z
# Versão: 1.0-VERIFIED
# Autor: Claude Sonnet 4.5 + Don Paulo Ricardo, PhD
###############################################################################

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔒 REGENERA BANK - VERIFICAÇÃO DE INTEGRIDADE" -ForegroundColor Cyan
Write-Host "   Auditoria Técnica Enterprise" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Arquivos e hashes esperados
$Files = @{
    "REGENERA_BANK_AUDITORIA_TECNICA_V1.md" = "49947b89f72ab62dd9da63e70f9c1bd7dc07a9fbbeef556c9a1336309d34595b"
    "REGENERA_BANK_AUDITORIA_EXECUTIVA_V1.md" = "1ec30e266f4f73a517d91b66a27ae21ec382651dc3a5900b486dd44676dee22f"
}

Write-Host "📋 Arquivos a verificar: $($Files.Count)" -ForegroundColor Blue
Write-Host ""

# Contadores
$Total = 0
$Passed = 0
$Failed = 0

# Verificar cada arquivo
foreach ($File in $Files.Keys) {
    $Total++
    $ExpectedHash = $Files[$File]
    
    Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray
    Write-Host "📄 Arquivo: $File" -ForegroundColor Yellow
    
    # Verificar se arquivo existe
    if (-not (Test-Path $File)) {
        Write-Host "   ❌ ERRO: Arquivo não encontrado" -ForegroundColor Red
        $Failed++
        continue
    }
    
    # Calcular hash
    Write-Host "   🔍 Calculando hash SHA-256... " -NoNewline
    try {
        $CalculatedHash = (Get-FileHash -Path $File -Algorithm SHA256).Hash.ToLower()
        Write-Host "OK" -ForegroundColor Green
    }
    catch {
        Write-Host "ERRO" -ForegroundColor Red
        Write-Host "   ❌ Falha ao calcular hash: $_" -ForegroundColor Red
        $Failed++
        continue
    }
    
    # Exibir hashes
    Write-Host "   Hash Esperado:  $ExpectedHash"
    Write-Host "   Hash Calculado: $CalculatedHash"
    
    # Comparar
    if ($CalculatedHash -eq $ExpectedHash) {
        Write-Host "   ✅ VERIFICAÇÃO PASSOU" -ForegroundColor Green
        Write-Host "      Documento é AUTÊNTICO e NÃO FOI MODIFICADO" -ForegroundColor Green
        $Passed++
    }
    else {
        Write-Host "   ❌ VERIFICAÇÃO FALHOU" -ForegroundColor Red
        Write-Host "      Documento foi ALTERADO ou CORROMPIDO" -ForegroundColor Red
        $Failed++
    }
    Write-Host ""
}

# Resumo final
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 RESUMO DA VERIFICAÇÃO" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   Total de Arquivos:    $Total"
Write-Host "   Passou:               $Passed" -ForegroundColor Green
if ($Failed -gt 0) {
    Write-Host "   Falhou:               $Failed" -ForegroundColor Red
}
else {
    Write-Host "   Falhou:               $Failed"
}
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray

if ($Failed -eq 0 -and $Passed -eq $Total) {
    Write-Host ""
    Write-Host "✅ TODOS OS DOCUMENTOS SÃO AUTÊNTICOS E ÍNTEGROS" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔐 Certificado de Integridade:" -ForegroundColor Cyan
    Write-Host "   ├─ Data de Geração: 2025-12-20 18:45 UTC"
    Write-Host "   ├─ Validade: 10 anos (até 2035-12-20)"
    Write-Host "   ├─ Auditor: Claude Sonnet 4.5 (Anthropic)"
    Write-Host "   ├─ CTO: Don Paulo Ricardo, PhD"
    Write-Host "   └─ ORCID: 0000-0003-3719-717X"
    Write-Host ""
    exit 0
}
else {
    Write-Host ""
    Write-Host "❌ ATENÇÃO: FALHAS DE INTEGRIDADE DETECTADAS" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  Possíveis causas:" -ForegroundColor Yellow
    Write-Host "   • Documento foi modificado após geração"
    Write-Host "   • Arquivo corrompido durante transferência"
    Write-Host "   • Versão incorreta do documento"
    Write-Host ""
    Write-Host "🔧 Ações recomendadas:" -ForegroundColor Yellow
    Write-Host "   • Baixe novamente os documentos originais"
    Write-Host "   • Verifique se não há edições não autorizadas"
    Write-Host "   • Entre em contato com o emissor se persistir"
    Write-Host ""
    exit 1
}
