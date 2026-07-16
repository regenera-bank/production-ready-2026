# @regenera/protection

Insurance-like protection products.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { ProtectionModule } from '@regenera/protection';

@Module({
  imports: [ProtectionModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `PROTECTION_ADAPTER=simulator|sandbox|production`
