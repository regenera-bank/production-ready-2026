# @regenera/rewards

Loyalty points and rewards.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { RewardsModule } from '@regenera/rewards';

@Module({
  imports: [RewardsModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `REWARDS_ADAPTER=simulator|sandbox|production`
