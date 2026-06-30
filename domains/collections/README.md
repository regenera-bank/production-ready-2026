# @regenera/collections

Delinquency and collections workflows.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { CollectionsModule } from '@regenera/collections';

@Module({
  imports: [CollectionsModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `COLLECTIONS_ADAPTER=simulator|sandbox|production`
