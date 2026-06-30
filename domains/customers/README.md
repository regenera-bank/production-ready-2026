# @regenera/customers

Customer profile and party registry.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { CustomersModule } from '@regenera/customers';

@Module({
  imports: [CustomersModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `CUSTOMERS_ADAPTER=simulator|sandbox|production`
