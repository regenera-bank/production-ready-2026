# @regenera/marketplace

Partner marketplace catalog.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { MarketplaceModule } from '@regenera/marketplace';

@Module({
  imports: [MarketplaceModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `MARKETPLACE_ADAPTER=simulator|sandbox|production`
