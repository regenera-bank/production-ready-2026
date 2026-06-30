/**
 * REGENERA BANK - HARDHAT CONFIGURATION
 * Configuração production-ready para deployment blockchain
 * 
 * Networks Supported:
 * - Polygon Mainnet (production)
 * - Mumbai Testnet (testing)
 * - Localhost (development)
 * 
 * Features:
 * - Auto-verification (Polygonscan)
 * - Gas optimization
 * - Multiple signers
 * - Etherscan API integration
 * 
 * Autor: Don Paulo Ricardo, PhD
 */

require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();

// ==================== CONFIGURATION ====================

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";
const MUMBAI_RPC_URL = process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com";

// Gas Reporter Config
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";
const REPORT_GAS = process.env.REPORT_GAS === "true";

// ==================== HARDHAT CONFIG ====================

module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200 // Balance between deployment cost and runtime cost
            },
            viaIR: true // Enable IR-based code generation for better optimization
        }
    },
    
    networks: {
        // Local Development
        hardhat: {
            chainId: 31337,
            forking: POLYGON_RPC_URL ? {
                url: POLYGON_RPC_URL,
                enabled: false // Set to true to fork mainnet for testing
            } : undefined
        },
        
        localhost: {
            chainId: 31337,
            url: "http://127.0.0.1:8545"
        },
        
        // Polygon Mumbai Testnet
        mumbai: {
            chainId: 80001,
            url: MUMBAI_RPC_URL,
            accounts: [PRIVATE_KEY],
            gasPrice: "auto",
            gas: "auto"
        },
        
        // Polygon Mainnet (Production)
        polygon: {
            chainId: 137,
            url: POLYGON_RPC_URL,
            accounts: [PRIVATE_KEY],
            gasPrice: "auto",
            gas: "auto",
            // confirmations: 5, // Wait for 5 confirmations
            // timeout: 200000 // 200 seconds timeout
        }
    },
    
    // Etherscan/Polygonscan Verification
    etherscan: {
        apiKey: {
            polygon: POLYGONSCAN_API_KEY,
            polygonMumbai: POLYGONSCAN_API_KEY
        },
        customChains: [
            {
                network: "polygon",
                chainId: 137,
                urls: {
                    apiURL: "https://api.polygonscan.com/api",
                    browserURL: "https://polygonscan.com"
                }
            },
            {
                network: "polygonMumbai",
                chainId: 80001,
                urls: {
                    apiURL: "https://api-testnet.polygonscan.com/api",
                    browserURL: "https://mumbai.polygonscan.com"
                }
            }
        ]
    },
    
    // Gas Reporter
    gasReporter: {
        enabled: REPORT_GAS,
        currency: "USD",
        coinmarketcap: COINMARKETCAP_API_KEY,
        token: "MATIC",
        gasPriceApi: "https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice",
        outputFile: "./output/gas-report.txt",
        noColors: false,
        showTimeSpent: true,
        showMethodSig: true
    },
    
    // Paths
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
        deploy: "./scripts"
    },
    
    // Mocha (Testing)
    mocha: {
        timeout: 200000 // 200 seconds
    }
};

// ==================== TASKS ====================

// Task: Accounts
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();
    
    console.log("\n📋 Available Accounts:\n");
    
    for (const account of accounts) {
        const balance = await hre.ethers.provider.getBalance(account.address);
        console.log(`${account.address} - ${hre.ethers.formatEther(balance)} MATIC`);
    }
    
    console.log("");
});

// Task: Balance
task("balance", "Prints an account's balance")
    .addParam("account", "The account's address")
    .setAction(async (taskArgs, hre) => {
        const balance = await hre.ethers.provider.getBalance(taskArgs.account);
        console.log(`Balance: ${hre.ethers.formatEther(balance)} MATIC`);
    });

// Task: Verify deployment
task("verify-deployment", "Verify a deployed contract on Polygonscan")
    .addParam("address", "The contract address")
    .setAction(async (taskArgs, hre) => {
        console.log(`\n🔍 Verifying contract at ${taskArgs.address}...\n`);
        
        await hre.run("verify:verify", {
            address: taskArgs.address,
            constructorArguments: []
        });
        
        console.log("\n✅ Verification complete!\n");
    });

// Task: Deploy Certificate
task("deploy-certificate", "Deploy the RegeneraBankCertificate contract")
    .setAction(async (taskArgs, hre) => {
        console.log("\n🚀 Deploying RegeneraBankCertificate...\n");
        
        const [deployer] = await hre.ethers.getSigners();
        const network = await hre.ethers.provider.getNetwork();
        
        console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
        console.log(`Deployer: ${deployer.address}`);
        console.log(`Balance: ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address))} MATIC\n`);
        
        const RegeneraBankCertificate = await hre.ethers.getContractFactory("RegeneraBankCertificate");
        const certificate = await RegeneraBankCertificate.deploy();
        await certificate.waitForDeployment();
        
        const address = await certificate.getAddress();
        
        console.log(`✅ Contract deployed to: ${address}`);
        console.log(`Transaction hash: ${certificate.deploymentTransaction().hash}\n`);
        
        // Wait for confirmations
        console.log("⏳ Waiting for 5 confirmations...");
        await certificate.deploymentTransaction().wait(5);
        console.log("✅ Confirmed!\n");
        
        // Auto-verify on Polygonscan
        if (network.name === "polygon" || network.name === "mumbai") {
            console.log("🔍 Verifying on Polygonscan...\n");
            
            try {
                await hre.run("verify:verify", {
                    address: address,
                    constructorArguments: []
                });
                console.log("✅ Verification successful!\n");
            } catch (error) {
                console.log("⚠️  Verification failed (may already be verified)");
                console.log(error.message);
            }
        }
        
        console.log("\n═══════════════════════════════════════════════════════════");
        console.log("DEPLOYMENT SUMMARY");
        console.log("═══════════════════════════════════════════════════════════");
        console.log(`Contract Address: ${address}`);
        console.log(`Network: ${network.name}`);
        console.log(`Chain ID: ${network.chainId}`);
        console.log(`Explorer: https://${network.name === 'mumbai' ? 'mumbai.' : ''}polygonscan.com/address/${address}`);
        console.log("═══════════════════════════════════════════════════════════\n");
        
        return address;
    });
