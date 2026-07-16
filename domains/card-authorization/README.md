# @regenera/card-authorization

Card authorization and limits at auth time.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { CardAuthorizationModule } from '@regenera/card-authorization';

@Module({
  imports: [CardAuthorizationModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `CARD_AUTHORIZATION_ADAPTER=simulator|sandbox|production`
