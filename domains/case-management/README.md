# @regenera/case-management

Investigation cases and maker-checker.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { CaseManagementModule } from '@regenera/case-management';

@Module({
  imports: [CaseManagementModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `CASE_MANAGEMENT_ADAPTER=simulator|sandbox|production`
