import { Global, Module } from '@nestjs/common';
import { HomologStoreService } from './homolog-store.service';

@Global()
@Module({
  providers: [HomologStoreService],
  exports: [HomologStoreService],
})
export class PersistenceModule {}