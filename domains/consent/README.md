# @regenera/consent

LGPD consent capture and revocation.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { ConsentModule } from '@regenera/consent';

@Module({
  imports: [ConsentModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `CONSENT_ADAPTER=simulator|sandbox|production`
