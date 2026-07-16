import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';
import { OnboardingService } from '../onboarding/onboarding.service';
import { AuthService, type ProfileUpdateInput } from './auth.service';
import { FirebaseAuthService } from './firebase-auth.service';
import { PasskeyService } from './passkey.service';
import { SessionGuard } from './session.guard';
import { RateLimitGuard } from './rate-limit.guard';
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
  displayName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  address?: AddressBody;
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

const resolveFirebaseEmail = (claimsEmail?: string, bodyEmail?: string): string => {
  const email = (claimsEmail ?? bodyEmail ?? '').trim().toLowerCase();
  if (!email) {
    throw new BadRequestException('E-mail obrigatório no cadastro Firebase');
  }
  return email;
};

const toFirebaseProfile = (
  body: FirebaseRegisterBody,
  fallbackEmail: string,
): ProfileUpdateInput => {
  if (
    !body.document?.trim() ||
    !body.displayName?.trim() ||
    !body.phone?.trim() ||
    !body.birthDate?.trim() ||
    !body.address?.street?.trim() ||
    !body.address?.postalCode?.trim()
  ) {
    throw new BadRequestException(
      'Perfil Firebase incompleto — CPF, nome, telefone, nascimento e endereço são obrigatórios',
    );
  }
  return {
    document: body.document.trim(),
    displayName: body.displayName.trim(),
    email: (body.email?.trim().toLowerCase() || fallbackEmail),
    phone: body.phone.trim(),
    birthDate: body.birthDate.trim(),
    address: body.address,
  };
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly firebase: FirebaseAuthService,
    private readonly passkeys: PasskeyService,
    private readonly onboarding: OnboardingService,
  ) {}

  @Post('register')
  @UseGuards(RateLimitGuard)
  async register(@Body() body: RegisterBody) {
    const session = await this.auth.register({
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
  @UseGuards(RateLimitGuard)
  async login(@Body() body: LoginBody, @Req() req: Request) {
    const channel = String(req.headers['x-channel'] ?? 'WEB').toUpperCase();
    const allowed = new Set(['WEB', 'ANDROID', 'IOS', 'DESKTOP', 'PWA', 'MOBILE']);
    const normalized = allowed.has(channel)
      ? (channel === 'MOBILE' ? 'ANDROID' : (channel as 'WEB' | 'ANDROID' | 'IOS' | 'DESKTOP' | 'PWA'))
      : 'WEB';
    const deviceFingerprint = String(req.headers['x-device-fingerprint'] ?? '').trim() || undefined;
    const session = await this.auth.createSession(
      body.document,
      body.password,
      normalized,
      deviceFingerprint,
    );
    return this.toSessionDto(session);
  }

  @Post('firebase/session')
  async firebaseSession(@Body() body: FirebaseTokenBody) {
    const claims = await this.firebase.verifyIdToken(body.idToken);
    const existing = this.auth.findUserByFirebaseUid(claims.uid);
    const user =
      existing ??
      this.auth.syncFirebaseUser(
        claims.uid,
        claims.email ?? '',
        claims.name,
      );
    if (!existing) {
      this.onboarding.initForUser(user.userId);
    }
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
    const email = resolveFirebaseEmail(claims.email, body.email);
    const user = this.auth.registerFirebaseUser(
      claims.uid,
      email,
      toFirebaseProfile(body, email),
    );
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
    const email = resolveFirebaseEmail(claims.email, body.email);
    const user = this.auth.registerFirebaseUser(
      claims.uid,
      email,
      toFirebaseProfile(body, email),
    );
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
  @UseGuards(RateLimitGuard)
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
  @UseGuards(RateLimitGuard)
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

  @Post('session/refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    const session = await this.auth.refreshSession(body.refreshToken ?? '');
    return this.toSessionDto(session);
  }

  @Post('session/revoke')
  @UseGuards(SessionGuard)
  async revokeSession(@Req() req: AuthedRequest) {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    await this.auth.revokeSession(token);
    return { ok: true, revoked: true };
  }

  @Post('session/revoke-all')
  @UseGuards(SessionGuard)
  revokeAllSessions(@Req() req: AuthedRequest) {
    const count = this.auth.revokeAllSessionsForUser(req.session.userId);
    return { ok: true, revokedSessions: count };
  }

  private toSessionDto(session: {
    accessToken: string;
    refreshToken?: string;
    userId: string;
    displayName: string;
    expiresAt: string;
    refreshExpiresAt?: string;
  }) {
    return {
      accessToken: session.accessToken,
      ...(session.refreshToken ? { refreshToken: session.refreshToken } : {}),
      userId: session.userId,
      displayName: session.displayName,
      expiresAt: session.expiresAt,
      ...(session.refreshExpiresAt
        ? { refreshExpiresAt: session.refreshExpiresAt }
        : {}),
      kycStatus: this.onboarding.getKycStatus(session.userId),
      accountStatus: this.onboarding.getAccountStatus(session.userId),
    };
  }
}