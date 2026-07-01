import { Module } from '@nestjs/common';
import { CardsModule } from '@regenera/cards';
import { InvestmentsModule } from '@regenera/investments';
import { AuthModule } from '../auth/auth.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    PersistenceModule,
    AuthModule,
    CardsModule.register({ adapter: 'sandbox' }),
    InvestmentsModule.register({ adapter: 'sandbox' }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}