# @regenera/pix

PIX engine + SPI/DICT integration surface.

## Activation

| Adapter | Status |
|---------|--------|
| simulator | **ACTIVE** (local CI) |
| sandbox | **ACTIVE** (homolog) |
| production | **EXTERNAL_ACTIVATION_REQUIRED** |

## Delegation

This domain is a thin boundary over `@regenera/core-bank`. Do not duplicate ledger, payment, or PIX engines here — wire production adapters to core-bank modules when externally activated.

## SPI / DICT

PIX settlement rails are provided by `domains/integrations-spi` (SPI + DICT ports). Import `IntegrationsSpiModule` alongside `PixModule` for full rail coverage.

## Usage

```typescript
import { PixModule } from '@regenera/pix';

@Module({
  imports: [PixModule.register({ adapter: 'simulator' })],
})
export class AppModule {}
```

Environment override: `PIX_ADAPTER=simulator|sandbox|production`
