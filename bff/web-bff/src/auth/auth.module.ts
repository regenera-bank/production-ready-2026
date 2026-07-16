import { Module, forwardRef } from '@nestjs/common';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseAuthService } from './firebase-auth.service';
import { PasskeyService } from './passkey.service';
import { SessionGuard } from './session.guard';

@Module({
  imports: [forwardRef(() => OnboardingModule)],
  controllers: [AuthController],
  providers: [AuthService, FirebaseAuthService, PasskeyService, SessionGuard],
  exports: [AuthService, FirebaseAuthService, SessionGuard],
})
export class AuthModule {}