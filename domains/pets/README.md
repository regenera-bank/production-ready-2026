# @regenera/pets

Pet-related financial products.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { PetsModule } from '@regenera/pets';

@Module({
  imports: [PetsModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `PETS_ADAPTER=simulator|sandbox|production`
