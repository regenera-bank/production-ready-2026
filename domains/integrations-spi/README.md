# @regenera/integrations-spi

BACEN SPI and DICT rail adapters.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Rails

- **SPI** — instant payment settlement (`src/ports/spi.port.ts`)
- **DICT** — PIX key directory (`src/ports/dict.port.ts`)

## Usage

```typescript
import { IntegrationsSpiModule } from '@regenera/integrations-spi';

@Module({
  imports: [IntegrationsSpiModule.register({ spiAdapter: 'simulator', dictAdapter: 'simulator' })],
})
export class AppModule {}
```

Environment overrides: `INTEGRATIONS_SPI_ADAPTER`, `INTEGRATIONS_DICT_ADAPTER` (`simulator|sandbox|production`)
