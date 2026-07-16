# @regenera/custody

Asset custody and safekeeping.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { CustodyModule } from '@regenera/custody';

@Module({
  imports: [CustodyModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `CUSTODY_ADAPTER=simulator|sandbox|production`
