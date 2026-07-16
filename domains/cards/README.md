# @regenera/cards

Card product lifecycle.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { CardsModule } from '@regenera/cards';

@Module({
  imports: [CardsModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `CARDS_ADAPTER=simulator|sandbox|production`
