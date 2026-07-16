# @regenera/notifications

Outbound notification orchestration.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { NotificationsModule } from '@regenera/notifications';

@Module({
  imports: [NotificationsModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `NOTIFICATIONS_ADAPTER=simulator|sandbox|production`
