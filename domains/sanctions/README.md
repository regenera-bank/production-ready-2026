# @regenera/sanctions

Sanctions screening and watchlists.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { SanctionsModule } from '@regenera/sanctions';

@Module({
  imports: [SanctionsModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `SANCTIONS_ADAPTER=simulator|sandbox|production`
