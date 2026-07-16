# @regenera/crypto

Virtual assets program (regulatory gate).

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI, flag off) |
| sandbox | **ACTIVE** (homolog, flag off) |
| production | **REGULATORY_ACTIVATION_REQUIRED** |

Feature flags: `CRYPTO_ENABLED=false`, `CRYPTO_TRADING_LIVE=false` (see `governance/feature-flags/FEATURE-FLAGS.json`).

## Usage

```typescript
import { CryptoModule } from '@regenera/crypto';

@Module({
  imports: [CryptoModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `CRYPTO_ADAPTER=simulator|sandbox|production`
