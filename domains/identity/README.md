# @regenera/identity

Authentication, MFA, and principal lifecycle.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { IdentityModule } from '@regenera/identity';

@Module({
  imports: [IdentityModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `IDENTITY_ADAPTER=simulator|sandbox|production`
