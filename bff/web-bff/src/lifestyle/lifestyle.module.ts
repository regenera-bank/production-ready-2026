import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { LifestyleController } from './lifestyle.controller';
import { LifestyleService } from './lifestyle.service';

@Module({
  imports: [PersistenceModule, AuthModule],
  controllers: [LifestyleController],
  providers: [LifestyleService],
  exports: [LifestyleService],
})
export class LifestyleModule {}