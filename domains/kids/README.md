# @regenera/kids

Minor accounts and parental controls.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { KidsModule } from '@regenera/kids';

@Module({
  imports: [KidsModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `KIDS_ADAPTER=simulator|sandbox|production`
