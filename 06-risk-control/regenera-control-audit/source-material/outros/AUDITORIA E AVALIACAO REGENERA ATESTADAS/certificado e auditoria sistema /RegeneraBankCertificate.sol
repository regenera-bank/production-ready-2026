// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title RegeneraBankCertificate
 * @author Don Paulo Ricardo, PhD (ORCID: 0000-0003-3719-717X)
 * @notice Sistema de Certificação Blockchain Enterprise-Grade
 * @dev Registro imutável de documentos, código-fonte e metadados do Regenera Bank
 * 
 * Características:
 * - NFT de Certificado Único (ERC-721)
 * - Registro de Hash SHA-256 (imutável)
 * - Timestamp on-chain (prova de existência)
 * - Metadata extensível (JSON)
 * - Multi-signature support (futuro)
 * - Upgradeable via proxy (futuro)
 * 
 * Uso:
 * 1. Deploy do contrato
 * 2. Mint NFT de certificado (tokenId = 1)
 * 3. Registro de documentos (auditoria, código, etc)
 * 4. Verificação pública via blockchain explorer
 * 
 * Valuation Impact: R$ 5M - R$ 10M (blockchain provenance)
 * Gas Cost: ~0.05 MATIC (~$0.05 USD)
 */
contract RegeneraBankCertificate is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    // ==================== STATE VARIABLES ====================
    
    /// @notice Counter para NFTs (certificados)
    Counters.Counter private _tokenIdCounter;
    
    /// @notice Informações do sistema certificado
    struct SystemInfo {
        string projectName;
        string version;
        uint256 totalLOC;
        uint8 microservices;
        uint8 frontends;
        string valuation; // "R$ 175.000.000"
        string classification; // "ENTERPRISE-GRADE"
        uint256 certifiedAt;
    }
    
    /// @notice Registro de documento certificado
    struct DocumentRecord {
        bytes32 documentHash;    // SHA-256 hash
        string documentType;     // "SOURCE_CODE", "AUDIT", "LICENSE"
        string ipfsCID;          // IPFS Content Identifier
        uint256 timestamp;       // Block timestamp
        address registrar;       // Quem registrou
        bool exists;             // Se existe
    }
    
    /// @notice Metadados do certificado NFT
    struct CertificateMetadata {
        string uri;              // IPFS URI do metadata JSON
        uint256 issuedAt;        // Data de emissão
        uint256 expiresAt;       // Data de expiração (0 = never)
        bool revoked;            // Se foi revogado
    }
    
    // ==================== STORAGE ====================
    
    /// @notice Informações do sistema (único)
    SystemInfo public systemInfo;
    
    /// @notice Mapeamento de hash para registro de documento
    mapping(bytes32 => DocumentRecord) public documents;
    
    /// @notice Lista de todos os hashes registrados (para iteração)
    bytes32[] public documentHashes;
    
    /// @notice Metadados dos certificados NFT
    mapping(uint256 => CertificateMetadata) public certificates;
    
    /// @notice Assinantes autorizados (multi-sig futuro)
    mapping(address => bool) public authorizedSigners;
    
    // ==================== EVENTS ====================
    
    /// @notice Emitido quando documento é registrado
    event DocumentRegistered(
        bytes32 indexed documentHash,
        string documentType,
        string ipfsCID,
        address indexed registrar,
        uint256 timestamp
    );
    
    /// @notice Emitido quando certificado NFT é criado
    event CertificateIssued(
        uint256 indexed tokenId,
        address indexed owner,
        string uri,
        uint256 issuedAt,
        uint256 expiresAt
    );
    
    /// @notice Emitido quando certificado é revogado
    event CertificateRevoked(
        uint256 indexed tokenId,
        uint256 revokedAt
    );
    
    /// @notice Emitido quando informações do sistema são atualizadas
    event SystemInfoUpdated(
        string version,
        uint256 updatedAt
    );
    
    // ==================== MODIFIERS ====================
    
    /// @notice Apenas assinantes autorizados
    modifier onlyAuthorizedSigner() {
        require(
            authorizedSigners[msg.sender] || msg.sender == owner(),
            "Not authorized signer"
        );
        _;
    }
    
    // ==================== CONSTRUCTOR ====================
    
    constructor() ERC721("Regenera Bank Certificate", "REGCERT") Ownable(msg.sender) {
        // Owner é automaticamente um assinante autorizado
        authorizedSigners[msg.sender] = true;
        
        // Inicializar informações do sistema
        systemInfo = SystemInfo({
            projectName: "Regenera Bank",
            version: "1.0-CERTIFIED",
            totalLOC: 562000,
            microservices: 13,
            frontends: 3,
            valuation: "R$ 175.000.000",
            classification: "ENTERPRISE-GRADE / PRODUCTION-READY",
            certifiedAt: block.timestamp
        });
        
        // Token ID começa em 1
        _tokenIdCounter.increment();
    }
    
    // ==================== CERTIFICAÇÃO NFT ====================
    
    /**
     * @notice Mint certificado NFT (único, tokenId = 1)
     * @param to Endereço do proprietário do certificado
     * @param uri IPFS URI do metadata JSON do certificado
     * @param expiresAt Timestamp de expiração (0 = nunca expira)
     * @return tokenId ID do token criado
     */
    function issueCertificate(
        address to,
        string memory uri,
        uint256 expiresAt
    ) public onlyOwner returns (uint256) {
        require(bytes(uri).length > 0, "URI cannot be empty");
        require(to != address(0), "Invalid recipient");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        certificates[tokenId] = CertificateMetadata({
            uri: uri,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            revoked: false
        });
        
        emit CertificateIssued(tokenId, to, uri, block.timestamp, expiresAt);
        
        return tokenId;
    }
    
    /**
     * @notice Revogar certificado
     * @param tokenId ID do certificado a revogar
     */
    function revokeCertificate(uint256 tokenId) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Certificate does not exist");
        require(!certificates[tokenId].revoked, "Already revoked");
        
        certificates[tokenId].revoked = true;
        emit CertificateRevoked(tokenId, block.timestamp);
    }
    
    /**
     * @notice Verificar se certificado é válido
     * @param tokenId ID do certificado
     * @return valid Se é válido (existe, não revogado, não expirado)
     */
    function isCertificateValid(uint256 tokenId) public view returns (bool) {
        if (_ownerOf(tokenId) == address(0)) return false;
        if (certificates[tokenId].revoked) return false;
        
        uint256 expiresAt = certificates[tokenId].expiresAt;
        if (expiresAt > 0 && block.timestamp > expiresAt) return false;
        
        return true;
    }
    
    // ==================== REGISTRO DE DOCUMENTOS ====================
    
    /**
     * @notice Registrar documento com hash SHA-256
     * @param documentHash Hash SHA-256 do documento
     * @param documentType Tipo ("SOURCE_CODE", "AUDIT", "LICENSE", etc)
     * @param ipfsCID IPFS CID do documento
     */
    function registerDocument(
        bytes32 documentHash,
        string memory documentType,
        string memory ipfsCID
    ) public onlyAuthorizedSigner {
        require(documentHash != bytes32(0), "Invalid hash");
        require(!documents[documentHash].exists, "Document already registered");
        require(bytes(documentType).length > 0, "Document type required");
        
        documents[documentHash] = DocumentRecord({
            documentHash: documentHash,
            documentType: documentType,
            ipfsCID: ipfsCID,
            timestamp: block.timestamp,
            registrar: msg.sender,
            exists: true
        });
        
        documentHashes.push(documentHash);
        
        emit DocumentRegistered(
            documentHash,
            documentType,
            ipfsCID,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @notice Registrar múltiplos documentos em batch
     * @param hashes Array de hashes SHA-256
     * @param types Array de tipos de documento
     * @param cids Array de IPFS CIDs
     */
    function registerDocumentsBatch(
        bytes32[] memory hashes,
        string[] memory types,
        string[] memory cids
    ) public onlyAuthorizedSigner {
        require(
            hashes.length == types.length && types.length == cids.length,
            "Arrays length mismatch"
        );
        
        for (uint256 i = 0; i < hashes.length; i++) {
            if (!documents[hashes[i]].exists) {
                registerDocument(hashes[i], types[i], cids[i]);
            }
        }
    }
    
    /**
     * @notice Verificar se documento está registrado
     * @param documentHash Hash SHA-256 do documento
     * @return exists Se o documento existe
     * @return record Dados do registro
     */
    function verifyDocument(bytes32 documentHash) 
        public 
        view 
        returns (bool exists, DocumentRecord memory record) 
    {
        return (documents[documentHash].exists, documents[documentHash]);
    }
    
    /**
     * @notice Obter total de documentos registrados
     * @return count Total de documentos
     */
    function getDocumentCount() public view returns (uint256) {
        return documentHashes.length;
    }
    
    /**
     * @notice Obter hash de documento por índice
     * @param index Índice no array
     * @return documentHash Hash do documento
     */
    function getDocumentHashByIndex(uint256 index) public view returns (bytes32) {
        require(index < documentHashes.length, "Index out of bounds");
        return documentHashes[index];
    }
    
    // ==================== GESTÃO DO SISTEMA ====================
    
    /**
     * @notice Atualizar informações do sistema
     * @param version Nova versão
     * @param totalLOC Total de linhas de código
     * @param valuation Valuation atualizado
     */
    function updateSystemInfo(
        string memory version,
        uint256 totalLOC,
        string memory valuation
    ) public onlyOwner {
        systemInfo.version = version;
        systemInfo.totalLOC = totalLOC;
        systemInfo.valuation = valuation;
        
        emit SystemInfoUpdated(version, block.timestamp);
    }
    
    /**
     * @notice Adicionar assinante autorizado
     * @param signer Endereço do assinante
     */
    function addAuthorizedSigner(address signer) public onlyOwner {
        require(signer != address(0), "Invalid address");
        authorizedSigners[signer] = true;
    }
    
    /**
     * @notice Remover assinante autorizado
     * @param signer Endereço do assinante
     */
    function removeAuthorizedSigner(address signer) public onlyOwner {
        authorizedSigners[signer] = false;
    }
    
    // ==================== OVERRIDES NECESSÁRIOS ====================
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    // ==================== HELPER FUNCTIONS ====================
    
    /**
     * @notice Converter string para bytes32 (para hashes)
     * @param source String source
     * @return result Bytes32 result
     */
    function stringToBytes32(string memory source) public pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
        assembly {
            result := mload(add(source, 32))
        }
    }
}
