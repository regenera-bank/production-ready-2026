# @regenera/travel

Travel benefits and FX helpers.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { TravelModule } from '@regenera/travel';

@Module({
  imports: [TravelModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `TRAVEL_ADAPTER=simulator|sandbox|production`
