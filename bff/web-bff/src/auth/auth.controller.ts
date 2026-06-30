import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';
import { OnboardingService } from '../onboarding/onboarding.service';
import { AuthService } from './auth.service';
import { FirebaseAuthService } from './firebase-auth.service';
import { PasskeyService } from './passkey.service';
import { SessionGuard } from './session.guard';
import { SessionRecord } from './auth.service';

type AuthedRequest = Request & { session: SessionRecord };

interface LoginBody {
  document: string;
  password: string;
}

interface AddressBody {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
}

interface RegisterBody {
  document: string;
  password: string;
  displayName: string;
  email: string;
  phone: string;
  birthDate: string;
  address: AddressBody;
}

interface PasskeyRegisterOptionsBody {
  document: string;
  password: string;
}

interface PasskeyDocumentBody {
  document: string;
}

interface FirebaseTokenBody {
  idToken: string;
}

interface FirebaseRegisterBody extends RegisterBody {
  idToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly firebase: FirebaseAuthService,
    private readonly passkeys: PasskeyService,
    private readonly onboarding: OnboardingService,
  ) {}

  @Post('register')
  register(@Body() body: RegisterBody) {
    const session = this.auth.register({
      document: body.document,
      password: body.password,
      displayName: body.displayName,
      email: body.email,
      phone: body.phone,
      birthDate: body.birthDate,
      address: body.address,
    });
    this.onboarding.initForUser(session.userId);
    return this.toSessionDto(session);
  }

  @Post('session')
  login(@Body() body: LoginBody) {
    const session = this.auth.createSession(body.document, body.password);
    return this.toSessionDto(session);
  }

  @Post('firebase/session')
  async firebaseSession(@Body() body: FirebaseTokenBody) {
    const claims = await this.firebase.verifyIdToken(body.idToken);
    const user =
      this.auth.findUserByFirebaseUid(claims.uid) ??
      this.auth.syncFirebaseUser(
        claims.uid,
        claims.email ?? '',
        claims.name,
      );
    const session = this.firebase.toSessionRecord(
      body.idToken,
      claims,
      user.displayName,
      user.userId,
    );
    return this.toSessionDto(session);
  }

  @Post('firebase/profile')
  async firebaseProfile(@Body() body: FirebaseRegisterBody) {
    const claims = await this.firebase.verifyIdToken(body.idToken);
    const user = this.auth.registerFirebaseUser(claims.uid, claims.email ?? body.email, {
      document: body.document,
      password: '',
      displayName: body.displayName,
      email: body.email,
      phone: body.phone,
      birthDate: body.birthDate,
      address: body.address,
    });
    this.onboarding.initForUser(user.userId);
    const session = this.firebase.toSessionRecord(
      body.idToken,
      claims,
      user.displayName,
      user.userId,
    );
    return this.toSessionDto(session);
  }

  @Post('firebase/register')
  async firebaseRegister(@Body() body: FirebaseRegisterBody) {
    const claims = await this.firebase.verifyIdToken(body.idToken);
    const user = this.auth.registerFirebaseUser(claims.uid, claims.email ?? body.email, {
      document: body.document,
      password: '',
      displayName: body.displayName,
      email: body.email,
      phone: body.phone,
      birthDate: body.birthDate,
      address: body.address,
    });
    this.onboarding.initForUser(user.userId);
    const session = this.firebase.toSessionRecord(
      body.idToken,
      claims,
      user.displayName,
      user.userId,
    );
    return this.toSessionDto(session);
  }

  @Get('passkey/status')
  passkeyStatus(@Query('document') document: string) {
    return { enrolled: this.passkeys.hasPasskey(document ?? '') };
  }

  @Get('passkey/status/me')
  @UseGuards(SessionGuard)
  passkeyStatusMe(@Req() req: AuthedRequest) {
    return {
      enrolled: this.passkeys.hasPasskeyForUser(req.session.userId),
    };
  }

  @Post('passkey/register/options/me')
  @UseGuards(SessionGuard)
  passkeyRegisterOptionsMe(@Req() req: AuthedRequest) {
    return this.passkeys.registrationOptionsForUser(req.session.userId);
  }

  @Post('passkey/register/verify/me')
  @UseGuards(SessionGuard)
  async passkeyRegisterVerifyMe(
    @Req() req: AuthedRequest,
    @Body() body: { response: RegistrationResponseJSON },
  ) {
    return this.passkeys.registrationVerifyForUser(
      req.session.userId,
      body.response,
    );
  }

  @Post('passkey/register/options')
  passkeyRegisterOptions(@Body() body: PasskeyRegisterOptionsBody) {
    return this.passkeys.registrationOptions(body.document, body.password);
  }

  @Post('passkey/register/verify')
  async passkeyRegisterVerify(
    @Body() body: PasskeyDocumentBody & { response: RegistrationResponseJSON },
  ) {
    const session = await this.passkeys.registrationVerify(
      body.document,
      body.response,
    );
    return this.toSessionDto(session);
  }

  @Post('passkey/login/options')
  passkeyLoginOptions(@Body() body: PasskeyDocumentBody) {
    return this.passkeys.authenticationOptions(body.document);
  }

  @Post('passkey/login/verify')
  async passkeyLoginVerify(
    @Body() body: PasskeyDocumentBody & { response: AuthenticationResponseJSON },
  ) {
    const session = await this.passkeys.authenticationVerify(
      body.document,
      body.response,
    );
    return this.toSessionDto(session);
  }

  @Post('password-reset/request')
  requestPasswordReset(@Body() body: { document: string }) {
    return this.auth.requestPasswordReset(body.document ?? '');
  }

  @Post('password-reset/confirm')
  confirmPasswordReset(
    @Body() body: { token: string; newPassword: string },
  ) {
    this.auth.confirmPasswordReset(body.token ?? '', body.newPassword ?? '');
    return { ok: true };
  }

  private toSessionDto(session: {
    accessToken: string;
    userId: string;
    displayName: string;
    expiresAt: string;
  }) {
    return {
      accessToken: session.accessToken,
      userId: session.userId,
      displayName: session.displayName,
      expiresAt: session.expiresAt,
      kycStatus: this.onboarding.getKycStatus(session.userId),
      accountStatus: this.onboarding.getAccountStatus(session.userId),
    };
  }
}