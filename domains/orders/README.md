# @regenera/orders

Order intake for tradable assets.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { OrdersModule } from '@regenera/orders';

@Module({
  imports: [OrdersModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `ORDERS_ADAPTER=simulator|sandbox|production`
