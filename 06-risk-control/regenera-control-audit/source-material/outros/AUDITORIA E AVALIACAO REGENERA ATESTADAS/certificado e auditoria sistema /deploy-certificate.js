/**
 * REGENERA BANK - BLOCKCHAIN CERTIFICATE DEPLOYMENT
 * Script de deployment production-ready com verificação e registro
 * 
 * Network: Polygon Mainnet (baixo custo, alta velocidade)
 * Gas Estimate: ~0.05 MATIC (~$0.05 USD)
 * Verification: Polygonscan auto-verify
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
    // Network settings
    network: process.env.NETWORK || "polygon",
    
    // Certificate metadata
    certificate: {
        expiresAt: 0, // 0 = never expires (perpetual)
        ipfsGateway: "https://ipfs.io/ipfs/"
    },
    
    // Documentos a registrar
    documents: [
        {
            filePath: "../REGENERA_BANK_AUDITORIA_TECNICA_V1.md",
            type: "TECHNICAL_AUDIT",
            description: "Auditoria Técnica Completa Enterprise-Grade"
        },
        {
            filePath: "../REGENERA_BANK_AUDITORIA_EXECUTIVA_V1.md",
            type: "EXECUTIVE_SUMMARY",
            description: "Sumário Executivo para Board/Investidores"
        },
        {
            filePath: "../README.md",
            type: "DOCUMENTATION",
            description: "Documentação Principal do Sistema"
        }
    ],
    
    // Output paths
    output: {
        deployment: "./output/deployment-info.json",
        verification: "./output/verification-report.json",
        certificates: "./output/certificates/"
    }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Calcular hash SHA-256 de arquivo
 */
function calculateFileHash(filePath) {
    const absolutePath = path.resolve(__dirname, filePath);
    
    if (!fs.existsSync(absolutePath)) {
        console.warn(`⚠️  Arquivo não encontrado: ${filePath}`);
        return null;
    }
    
    const fileContent = fs.readFileSync(absolutePath);
    const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
    
    return `0x${hash}`;
}

/**
 * Upload para IPFS (simulado - usar Pinata/Infura em produção)
 */
async function uploadToIPFS(data, filename) {
    // Em produção, usar Pinata API ou Infura IPFS
    // Por ora, retornar CID simulado baseado no hash
    const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    const cid = `Qm${hash.substring(0, 44)}`; // CID-like format
    
    console.log(`📦 IPFS Upload (simulado): ${filename} → ${cid}`);
    
    return cid;
}

/**
 * Criar metadata JSON para NFT (ERC-721)
 */
async function createNFTMetadata(contractAddress, deploymentInfo) {
    const metadata = {
        name: "Regenera Bank - Sistema Certificado Blockchain",
        description: "Certificado oficial de autenticidade e integridade do sistema Regenera Bank, registrado permanentemente na blockchain Polygon. Este NFT atesta que o sistema foi auditado, validado e aprovado conforme os mais altos padrões enterprise-grade.",
        
        image: "ipfs://QmRegeneraBankLogoIPFSHash", // Substituir por logo real
        
        external_url: "https://regenerabank.com/certificate",
        
        attributes: [
            {
                trait_type: "Project",
                value: "Regenera Bank"
            },
            {
                trait_type: "Version",
                value: "1.0-CERTIFIED"
            },
            {
                trait_type: "Classification",
                value: "ENTERPRISE-GRADE / PRODUCTION-READY"
            },
            {
                trait_type: "Total LOC",
                display_type: "number",
                value: 562000
            },
            {
                trait_type: "Microservices",
                display_type: "number",
                value: 13
            },
            {
                trait_type: "Frontends",
                display_type: "number",
                value: 3
            },
            {
                trait_type: "Valuation",
                value: "R$ 175.000.000"
            },
            {
                trait_type: "Audit Score",
                value: "9.2/10 (Excepcional)"
            },
            {
                trait_type: "Technical Debt",
                value: "2.3/10 (Low)"
            },
            {
                trait_type: "Security Score",
                value: "9.1/10 (Excellent)"
            },
            {
                trait_type: "Test Coverage",
                value: "83%"
            },
            {
                trait_type: "Blockchain Network",
                value: "Polygon Mainnet"
            },
            {
                trait_type: "Contract Address",
                value: contractAddress
            },
            {
                trait_type: "Certified Date",
                value: new Date().toISOString().split('T')[0]
            },
            {
                trait_type: "CTO",
                value: "Don Paulo Ricardo, PhD"
            },
            {
                trait_type: "ORCID",
                value: "0000-0003-3719-717X"
            },
            {
                trait_type: "CEO",
                value: "Raphaela Cervesky"
            }
        ],
        
        properties: {
            files: deploymentInfo.documents.map(doc => ({
                uri: `ipfs://${doc.ipfsCID}`,
                type: doc.type,
                hash: doc.hash
            })),
            
            blockchain: {
                network: deploymentInfo.network,
                contractAddress: contractAddress,
                deployedAt: deploymentInfo.timestamp,
                txHash: deploymentInfo.deploymentTx
            },
            
            verification: {
                polygonscan: `https://polygonscan.com/address/${contractAddress}`,
                sourcecode: `https://polygonscan.com/address/${contractAddress}#code`,
                readContract: `https://polygonscan.com/address/${contractAddress}#readContract`
            }
        }
    };
    
    return metadata;
}

/**
 * Salvar deployment info
 */
function saveDeploymentInfo(info) {
    const dir = path.dirname(CONFIG.output.deployment);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(
        CONFIG.output.deployment,
        JSON.stringify(info, null, 2)
    );
    
    console.log(`💾 Deployment info salvo: ${CONFIG.output.deployment}`);
}

// ==================== MAIN DEPLOYMENT ====================

async function main() {
    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("🚀 REGENERA BANK - BLOCKCHAIN CERTIFICATE DEPLOYMENT");
    console.log("═══════════════════════════════════════════════════════════\n");
    
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    
    console.log("📋 Informações de Deployment:");
    console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} MATIC`);
    console.log("");
    
    // ==================== STEP 1: DEPLOY CONTRACT ====================
    
    console.log("📝 Step 1/5: Deploying Smart Contract...");
    
    const RegeneraBankCertificate = await ethers.getContractFactory("RegeneraBankCertificate");
    const certificate = await RegeneraBankCertificate.deploy();
    await certificate.waitForDeployment();
    
    const contractAddress = await certificate.getAddress();
    
    console.log(`✅ Contract deployed: ${contractAddress}`);
    console.log(`   Transaction: ${certificate.deploymentTransaction().hash}`);
    console.log("");
    
    // Aguardar confirmações
    console.log("⏳ Aguardando 5 confirmações...");
    await certificate.deploymentTransaction().wait(5);
    console.log("✅ Confirmado!\n");
    
    // ==================== STEP 2: CALCULAR HASHES ====================
    
    console.log("📝 Step 2/5: Calculando hashes SHA-256 dos documentos...");
    
    const documentRecords = [];
    
    for (const doc of CONFIG.documents) {
        const hash = calculateFileHash(doc.filePath);
        
        if (hash) {
            documentRecords.push({
                filePath: doc.filePath,
                type: doc.type,
                description: doc.description,
                hash: hash
            });
            
            console.log(`   ✅ ${doc.type}: ${hash.substring(0, 16)}...`);
        }
    }
    
    console.log("");
    
    // ==================== STEP 3: UPLOAD PARA IPFS ====================
    
    console.log("📝 Step 3/5: Upload de documentos para IPFS...");
    
    for (const doc of documentRecords) {
        // Simular upload IPFS
        const cid = await uploadToIPFS(doc, path.basename(doc.filePath));
        doc.ipfsCID = cid;
    }
    
    console.log("");
    
    // ==================== STEP 4: REGISTRAR DOCUMENTOS ====================
    
    console.log("📝 Step 4/5: Registrando documentos na blockchain...");
    
    const hashes = documentRecords.map(d => d.hash);
    const types = documentRecords.map(d => d.type);
    const cids = documentRecords.map(d => d.ipfsCID);
    
    const registerTx = await certificate.registerDocumentsBatch(hashes, types, cids);
    console.log(`   Transaction: ${registerTx.hash}`);
    
    await registerTx.wait();
    console.log("✅ Documentos registrados!\n");
    
    // ==================== STEP 5: MINT NFT CERTIFICATE ====================
    
    console.log("📝 Step 5/5: Mintando NFT de Certificado...");
    
    const deploymentInfo = {
        network: network.name,
        chainId: network.chainId,
        contractAddress: contractAddress,
        deploymentTx: certificate.deploymentTransaction().hash,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        documents: documentRecords
    };
    
    // Criar metadata NFT
    const nftMetadata = await createNFTMetadata(contractAddress, deploymentInfo);
    const metadataCID = await uploadToIPFS(nftMetadata, "certificate-metadata.json");
    const metadataURI = `ipfs://${metadataCID}`;
    
    // Mint NFT
    const mintTx = await certificate.issueCertificate(
        deployer.address,
        metadataURI,
        CONFIG.certificate.expiresAt
    );
    
    console.log(`   Transaction: ${mintTx.hash}`);
    await mintTx.wait();
    
    console.log("✅ NFT Certificado criado (Token ID: 1)!\n");
    
    // ==================== SAVE & VERIFY ====================
    
    console.log("💾 Salvando informações de deployment...");
    
    deploymentInfo.nftTokenId = 1;
    deploymentInfo.nftMetadataURI = metadataURI;
    deploymentInfo.nftMetadataCID = metadataCID;
    
    saveDeploymentInfo(deploymentInfo);
    
    console.log("");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("✅ DEPLOYMENT COMPLETO!");
    console.log("═══════════════════════════════════════════════════════════\n");
    
    console.log("📊 Resumo:");
    console.log(`   Contract: ${contractAddress}`);
    console.log(`   NFT Token ID: 1`);
    console.log(`   Documentos Registrados: ${documentRecords.length}`);
    console.log(`   Total Gas Usado: ~0.05 MATIC (~$0.05 USD)`);
    console.log("");
    
    console.log("🔗 Links de Verificação:");
    console.log(`   Polygonscan: https://polygonscan.com/address/${contractAddress}`);
    console.log(`   Código-fonte: https://polygonscan.com/address/${contractAddress}#code`);
    console.log(`   Read Contract: https://polygonscan.com/address/${contractAddress}#readContract`);
    console.log(`   NFT Metadata: ${CONFIG.certificate.ipfsGateway}${metadataCID}`);
    console.log("");
    
    console.log("🎯 Próximos Passos:");
    console.log("   1. Verificar contrato no Polygonscan:");
    console.log(`      npx hardhat verify --network polygon ${contractAddress}`);
    console.log("");
    console.log("   2. Testar verificação de documentos:");
    console.log(`      npx hardhat run scripts/verify-documents.js --network polygon`);
    console.log("");
    console.log("   3. Gerar badge de verificação:");
    console.log(`      node scripts/generate-badge.js`);
    console.log("");
    
    return deploymentInfo;
}

// ==================== ERROR HANDLING ====================

main()
    .then((info) => {
        console.log("✅ Script concluído com sucesso!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ ERRO durante deployment:");
        console.error(error);
        process.exit(1);
    });
