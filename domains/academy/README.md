# @regenera/academy

Financial education content.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { AcademyModule } from '@regenera/academy';

@Module({
  imports: [AcademyModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `ACADEMY_ADAPTER=simulator|sandbox|production`
