# 05 — External Activation Register

| Integração | Production Adapter | Sandbox | Simulator | Status |
|------------|-------------------|---------|-----------|--------|
| SPI | `domains/integrations-spi` production stub | sandbox | simulator | EXTERNAL_ACTIVATION_REQUIRED |
| DICT | `domains/integrations-spi` | sandbox | simulator | EXTERNAL_ACTIVATION_REQUIRED |
| Card processor | `domains/cards` | sandbox | ISO8583 simulator | EXTERNAL_ACTIVATION_REQUIRED |
| KYC Prometeo | `domains/kyc` | homolog guard | simulator | EXTERNAL_ACTIVATION_REQUIRED (prod) |
| Crypto custody | `domains/crypto` | disabled | simulator | REGULATORY_ACTIVATION_REQUIRED |
| Firebase | BFF optional | homolog | stub | ROTATION_REQUIRED_BEFORE_DEPLOY |

Ver `domains/SCAFFOLD-MANIFEST.json` para 46 domínios com ports/adapters completos.