import { Module, forwardRef } from '@nestjs/common';
import { CoreBankModule } from '../integrations/core-bank';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { BaselineController } from './baseline.controller';
import { BaselineGuard } from './baseline.guard';
import { BaselineService } from './baseline.service';
@Module({
  imports: [
    CoreBankModule.forRoot(),
    forwardRef(() => OnboardingModule),
  ],
  controllers: [BaselineController],
  providers: [BaselineService, BaselineGuard],
  exports: [BaselineService],
})
export class BaselineModule {}