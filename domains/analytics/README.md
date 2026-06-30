# @regenera/analytics

Product analytics and insights.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { AnalyticsModule } from '@regenera/analytics';

@Module({
  imports: [AnalyticsModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `ANALYTICS_ADAPTER=simulator|sandbox|production`
