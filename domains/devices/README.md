# @regenera/devices

Device trust and binding.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Usage

```typescript
import { DevicesModule } from '@regenera/devices';

@Module({
  imports: [DevicesModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `DEVICES_ADAPTER=simulator|sandbox|production`
