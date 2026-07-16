# @regenera/events

Event ticketing and benefits.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { EventsModule } from '@regenera/events';

@Module({
  imports: [EventsModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `EVENTS_ADAPTER=simulator|sandbox|production`
