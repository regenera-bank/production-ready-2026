# @regenera/transfers

TED/DOC and internal transfer orchestration.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { TransfersModule } from '@regenera/transfers';

@Module({
  imports: [TransfersModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `TRANSFERS_ADAPTER=simulator|sandbox|production`
