/**
 * REGENERA BANK - BLOCKCHAIN VERIFICATION SCRIPT
 * Verificação de integridade de documentos via blockchain
 * 
 * Funcionalidades:
 * - Verifica documentos registrados no smart contract
 * - Compara hashes locais com blockchain
 * - Valida IPFS availability
 * - Gera relatório de verificação
 * - Exporta certificado de autenticidade
 * 
 * Autor: Don Paulo Ricardo, PhD
 * ORCID: 0000-0003-3719-717X
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ==================== CONFIGURAÇÃO ====================

const CONFIG = {
    // Deployment info path
    deploymentInfo: "./output/deployment-info.json",
    
    // Output paths
    output: {
        report: "./output/verification-report.json",
        certificate: "./output/authenticity-certificate.txt"
    },
    
    // IPFS gateways para verificação
    ipfsGateways: [
        "https://ipfs.io/ipfs/",
        "https://gateway.pinata.cloud/ipfs/",
        "https://cloudflare-ipfs.com/ipfs/",
        "https://dweb.link/ipfs/"
    ]
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Calcular hash SHA-256 de arquivo
 */
function calculateFileHash(filePath) {
    const absolutePath = path.resolve(__dirname, filePath);
    
    if (!fs.existsSync(absolutePath)) {
        return null;
    }
    
    const fileContent = fs.readFileSync(absolutePath);
    const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
    
    return `0x${hash}`;
}

/**
 * Carregar deployment info
 */
function loadDeploymentInfo() {
    if (!fs.existsSync(CONFIG.deploymentInfo)) {
        throw new Error(`Deployment info não encontrado: ${CONFIG.deploymentInfo}`);
    }
    
    return JSON.parse(fs.readFileSync(CONFIG.deploymentInfo, 'utf8'));
}

/**
 * Verificar disponibilidade IPFS
 */
async function verifyIPFSAvailability(cid) {
    const results = [];
    
    for (const gateway of CONFIG.ipfsGateways) {
        try {
            const url = `${gateway}${cid}`;
            const response = await fetch(url, { 
                method: 'HEAD',
                timeout: 5000 
            });
            
            results.push({
                gateway: gateway,
                available: response.ok,
                status: response.status
            });
        } catch (error) {
            results.push({
                gateway: gateway,
                available: false,
                error: error.message
            });
        }
    }
    
    const availableCount = results.filter(r => r.available).length;
    
    return {
        available: availableCount > 0,
        availableGateways: availableCount,
        totalGateways: CONFIG.ipfsGateways.length,
        gateways: results
    };
}

/**
 * Formatar timestamp
 */
function formatTimestamp(timestamp) {
    const date = new Date(Number(timestamp) * 1000);
    return date.toISOString();
}

/**
 * Gerar certificado de autenticidade
 */
function generateAuthenticityC certificate(verificationReport) {
    const cert = `
═══════════════════════════════════════════════════════════════════════
                    CERTIFICADO DE AUTENTICIDADE
                         REGENERA BANK SYSTEM
                    Blockchain Verification Report
═══════════════════════════════════════════════════════════════════════

INFORMAÇÕES DO SISTEMA:
─────────────────────────────────────────────────────────────────────
Projeto:              ${verificationReport.systemInfo.projectName}
Versão:               ${verificationReport.systemInfo.version}
Classificação:        ${verificationReport.systemInfo.classification}
Total LOC:            ${verificationReport.systemInfo.totalLOC.toLocaleString()}
Microserviços:        ${verificationReport.systemInfo.microservices}
Frontends:            ${verificationReport.systemInfo.frontends}
Valuation:            ${verificationReport.systemInfo.valuation}

BLOCKCHAIN REGISTRY:
─────────────────────────────────────────────────────────────────────
Network:              ${verificationReport.blockchain.network}
Chain ID:             ${verificationReport.blockchain.chainId}
Contract Address:     ${verificationReport.blockchain.contractAddress}
NFT Token ID:         ${verificationReport.blockchain.nftTokenId}

DOCUMENTOS VERIFICADOS:
─────────────────────────────────────────────────────────────────────
${verificationReport.documents.map((doc, i) => `
${i + 1}. ${doc.type}
   Hash SHA-256:      ${doc.hash}
   Status Local:      ${doc.localHashMatch ? '✅ MATCH' : '❌ MISMATCH'}
   Status Blockchain: ${doc.blockchainRegistered ? '✅ REGISTERED' : '❌ NOT FOUND'}
   IPFS CID:          ${doc.ipfsCID}
   IPFS Status:       ${doc.ipfsAvailable ? `✅ AVAILABLE (${doc.ipfsGateways})` : '❌ UNAVAILABLE'}
   Registrado em:     ${doc.timestamp}
   Registrador:       ${doc.registrar}
`).join('')}

RESULTADO DA VERIFICAÇÃO:
─────────────────────────────────────────────────────────────────────
Total de Documentos:        ${verificationReport.summary.totalDocuments}
Hashes Corretos:            ${verificationReport.summary.hashMatches}
Registrados Blockchain:     ${verificationReport.summary.blockchainRegistered}
Disponíveis IPFS:           ${verificationReport.summary.ipfsAvailable}

Status Geral:               ${verificationReport.summary.overallStatus}

${verificationReport.summary.overallStatus === 'VERIFIED' ? `
✅ CERTIFICADO DE AUTENTICIDADE VÁLIDO

Todos os documentos foram verificados e correspondem aos registros
imutáveis armazenados na blockchain Polygon. A integridade do sistema
Regenera Bank está GARANTIDA criptograficamente.
` : `
⚠️ ATENÇÃO: Inconsistências Detectadas

Alguns documentos apresentam divergências. Verifique o relatório
detalhado em ${CONFIG.output.report} para mais informações.
`}

VALIDADE:
─────────────────────────────────────────────────────────────────────
Data de Verificação:  ${new Date().toISOString()}
Válido por:           Perpétuo (enquanto blockchain existir)
Próxima Verificação:  ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}

AUDITORES:
─────────────────────────────────────────────────────────────────────
CTO:                  Don Paulo Ricardo, PhD
ORCID:                0000-0003-3719-717X
CEO:                  Raphaela Cervesky
Organização:          Regenera Bank / Don Paulo Ricardo Research Institute

VERIFICAÇÃO BLOCKCHAIN:
─────────────────────────────────────────────────────────────────────
Polygonscan:          https://polygonscan.com/address/${verificationReport.blockchain.contractAddress}
Código-fonte:         https://polygonscan.com/address/${verificationReport.blockchain.contractAddress}#code
Read Contract:        https://polygonscan.com/address/${verificationReport.blockchain.contractAddress}#readContract

═══════════════════════════════════════════════════════════════════════
Este certificado atesta que os documentos listados acima são autênticos
e suas assinaturas criptográficas correspondem aos registros imutáveis
armazenados na blockchain Polygon.

Qualquer pessoa pode verificar independentemente a autenticidade deste
certificado acessando o smart contract no endereço fornecido acima.

Gerado em: ${new Date().toISOString()}
Assinatura Digital: ${verificationReport.blockchain.contractAddress.substring(0, 20)}...
═══════════════════════════════════════════════════════════════════════
`;
    
    return cert;
}

// ==================== MAIN VERIFICATION ====================

async function main() {
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("🔍 REGENERA BANK - BLOCKCHAIN VERIFICATION");
    console.log("═══════════════════════════════════════════════════════════\n");
    
    // ==================== STEP 1: LOAD DEPLOYMENT INFO ====================
    
    console.log("📋 Step 1/5: Carregando deployment info...");
    const deploymentInfo = loadDeploymentInfo();
    console.log(`   ✅ Loaded: ${deploymentInfo.contractAddress}\n`);
    
    // ==================== STEP 2: CONNECT TO CONTRACT ====================
    
    console.log("📋 Step 2/5: Conectando ao smart contract...");
    
    const certificate = await ethers.getContractAt(
        "RegeneraBankCertificate",
        deploymentInfo.contractAddress
    );
    
    // Verificar system info
    const systemInfo = await certificate.systemInfo();
    
    console.log(`   ✅ Connected to: ${systemInfo.projectName}`);
    console.log(`   Version: ${systemInfo.version}`);
    console.log(`   Classification: ${systemInfo.classification}\n`);
    
    // ==================== STEP 3: VERIFY DOCUMENTS ====================
    
    console.log("📋 Step 3/5: Verificando documentos...");
    
    const verifiedDocuments = [];
    
    for (const doc of deploymentInfo.documents) {
        console.log(`   📄 Verificando: ${doc.type}...`);
        
        // Calcular hash local
        const localHash = calculateFileHash(doc.filePath);
        const hashMatch = localHash === doc.hash;
        
        // Verificar no blockchain
        const [exists, record] = await certificate.verifyDocument(doc.hash);
        
        // Verificar IPFS
        const ipfsVerification = await verifyIPFSAvailability(doc.ipfsCID);
        
        const result = {
            type: doc.type,
            description: doc.description,
            filePath: doc.filePath,
            hash: doc.hash,
            localHashMatch: hashMatch,
            blockchainRegistered: exists,
            ipfsCID: doc.ipfsCID,
            ipfsAvailable: ipfsVerification.available,
            ipfsGateways: `${ipfsVerification.availableGateways}/${ipfsVerification.totalGateways}`,
            timestamp: exists ? formatTimestamp(record.timestamp) : null,
            registrar: exists ? record.registrar : null
        };
        
        verifiedDocuments.push(result);
        
        const status = hashMatch && exists && ipfsVerification.available ? '✅' : '⚠️';
        console.log(`   ${status} ${doc.type}: ${hashMatch ? 'Hash OK' : 'Hash FAIL'} | ${exists ? 'Blockchain OK' : 'Blockchain FAIL'} | ${ipfsVerification.available ? 'IPFS OK' : 'IPFS FAIL'}`);
    }
    
    console.log("");
    
    // ==================== STEP 4: VERIFY NFT CERTIFICATE ====================
    
    console.log("📋 Step 4/5: Verificando NFT de Certificado...");
    
    const tokenId = deploymentInfo.nftTokenId || 1;
    const isValid = await certificate.isCertificateValid(tokenId);
    const certMetadata = await certificate.certificates(tokenId);
    
    console.log(`   Token ID: ${tokenId}`);
    console.log(`   Válido: ${isValid ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   Emitido em: ${formatTimestamp(certMetadata.issuedAt)}`);
    console.log(`   Expira em: ${certMetadata.expiresAt == 0 ? 'NUNCA (Perpétuo)' : formatTimestamp(certMetadata.expiresAt)}`);
    console.log(`   Revogado: ${certMetadata.revoked ? '❌ SIM' : '✅ NÃO'}\n`);
    
    // ==================== STEP 5: GENERATE REPORT ====================
    
    console.log("📋 Step 5/5: Gerando relatório...");
    
    const summary = {
        totalDocuments: verifiedDocuments.length,
        hashMatches: verifiedDocuments.filter(d => d.localHashMatch).length,
        blockchainRegistered: verifiedDocuments.filter(d => d.blockchainRegistered).length,
        ipfsAvailable: verifiedDocuments.filter(d => d.ipfsAvailable).length,
        overallStatus: verifiedDocuments.every(d => d.localHashMatch && d.blockchainRegistered && d.ipfsAvailable) ? 'VERIFIED' : 'ISSUES_DETECTED'
    };
    
    const verificationReport = {
        verificationType: "BLOCKCHAIN_INTEGRITY_CHECK",
        verifiedAt: new Date().toISOString(),
        systemInfo: {
            projectName: systemInfo.projectName,
            version: systemInfo.version,
            classification: systemInfo.classification,
            totalLOC: Number(systemInfo.totalLOC),
            microservices: systemInfo.microservices,
            frontends: systemInfo.frontends,
            valuation: systemInfo.valuation
        },
        blockchain: {
            network: deploymentInfo.network,
            chainId: deploymentInfo.chainId,
            contractAddress: deploymentInfo.contractAddress,
            nftTokenId: tokenId,
            nftValid: isValid
        },
        documents: verifiedDocuments,
        summary: summary
    };
    
    // Salvar relatório JSON
    const reportDir = path.dirname(CONFIG.output.report);
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(
        CONFIG.output.report,
        JSON.stringify(verificationReport, null, 2)
    );
    
    console.log(`   ✅ Relatório JSON: ${CONFIG.output.report}`);
    
    // Gerar certificado de autenticidade
    const authCertificate = generateAuthenticityC(verificationReport);
    fs.writeFileSync(CONFIG.output.certificate, authCertificate);
    
    console.log(`   ✅ Certificado TXT: ${CONFIG.output.certificate}\n`);
    
    // ==================== FINAL SUMMARY ====================
    
    console.log("═══════════════════════════════════════════════════════════");
    console.log("📊 RESULTADO DA VERIFICAÇÃO");
    console.log("═══════════════════════════════════════════════════════════\n");
    
    console.log(`Total de Documentos:        ${summary.totalDocuments}`);
    console.log(`Hashes Corretos:            ${summary.hashMatches}/${summary.totalDocuments} ✅`);
    console.log(`Registrados Blockchain:     ${summary.blockchainRegistered}/${summary.totalDocuments} ✅`);
    console.log(`Disponíveis IPFS:           ${summary.ipfsAvailable}/${summary.totalDocuments} ✅`);
    console.log("");
    
    if (summary.overallStatus === 'VERIFIED') {
        console.log("✅ STATUS GERAL: VERIFICADO E AUTÊNTICO");
        console.log("");
        console.log("Todos os documentos passaram na verificação de integridade.");
        console.log("O sistema Regenera Bank está certificado e auditável via blockchain.");
    } else {
        console.log("⚠️  STATUS GERAL: INCONSISTÊNCIAS DETECTADAS");
        console.log("");
        console.log("Algumas verificações falharam. Verifique o relatório detalhado.");
    }
    
    console.log("");
    console.log("🔗 Links de Verificação:");
    console.log(`   Polygonscan: https://polygonscan.com/address/${deploymentInfo.contractAddress}`);
    console.log(`   Relatório JSON: ${CONFIG.output.report}`);
    console.log(`   Certificado: ${CONFIG.output.certificate}`);
    console.log("");
    
    return verificationReport;
}

// ==================== ERROR HANDLING ====================

main()
    .then((report) => {
        console.log("✅ Verificação concluída!");
        process.exit(report.summary.overallStatus === 'VERIFIED' ? 0 : 1);
    })
    .catch((error) => {
        console.error("\n❌ ERRO durante verificação:");
        console.error(error);
        process.exit(1);
    });
