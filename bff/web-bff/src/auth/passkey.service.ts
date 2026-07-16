import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';
import {
  ChannelAncillaryService,
  type StoredPasskeyRecord,
} from '@regenera/channel-persistence';
import { AuthService, SessionRecord } from './auth.service';

interface StoredPasskey {
  credentialId: string;
  publicKey: Uint8Array;
  counter: number;
  transports?: AuthenticatorTransportFuture[];
}

const rpName = 'Regenera Bank';
const rpID = process.env.WEBAUTHN_RP_ID ?? 'localhost';

const allowedOrigins = (): string[] => {
  const primary = process.env.WEB_ORIGIN?.trim() || 'http://localhost:5176';
  const origins = new Set<string>([primary]);
  try {
    const url = new URL(primary);
    if (url.hostname === 'localhost') {
      const port = url.port || (url.protocol === 'https:' ? '443' : '80');
      origins.add(`${url.protocol}//127.0.0.1:${port}`);
    }
    if (url.hostname === '127.0.0.1') {
      const port = url.port || (url.protocol === 'https:' ? '443' : '80');
      origins.add(`${url.protocol}//localhost:${port}`);
    }
  } catch {
    origins.add('http://localhost:5176');
    origins.add('http://127.0.0.1:5176');
  }
  return [...origins];
};

const toStoredPasskey = (record: StoredPasskeyRecord): StoredPasskey => ({
  credentialId: record.credentialId,
  publicKey: new Uint8Array(Buffer.from(record.publicKeyBase64, 'base64')),
  counter: record.counter,
  transports: record.transports as AuthenticatorTransportFuture[] | undefined,
});

const toPasskeyRecord = (item: StoredPasskey): StoredPasskeyRecord => ({
  credentialId: item.credentialId,
  publicKeyBase64: Buffer.from(item.publicKey).toString('base64'),
  counter: item.counter,
  transports: item.transports,
});

@Injectable()
export class PasskeyService {
  private readonly registrationChallenges = new Map<string, string>();
  private readonly authenticationChallenges = new Map<string, string>();

  constructor(
    private readonly auth: AuthService,
    private readonly ancillary: ChannelAncillaryService,
  ) {}

  hasPasskey(document: string): boolean {
    const userId = this.auth.resolveUserId(document);
    if (!userId) return false;
    return this.hasPasskeyForUser(userId);
  }

  hasPasskeyForUser(userId: string): boolean {
    return this.ancillary.listPasskeys(userId).length > 0;
  }

  async registrationOptionsForUser(userId: string) {
    const user = this.auth.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Conta não encontrada');
    }
    return this.buildRegistrationOptions(user);
  }

  async registrationOptions(document: string, password: string) {
    const user = this.auth.verifyUserPassword(document, password);
    return this.buildRegistrationOptions(user);
  }

  private async buildRegistrationOptions(user: {
    userId: string;
    document: string;
    displayName: string;
  }) {
    const existing = this.ancillary.listPasskeys(user.userId).map(toStoredPasskey);
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: user.document,
      userDisplayName: user.displayName,
      userID: new TextEncoder().encode(user.userId),
      attestationType: 'none',
      excludeCredentials: existing.map((item) => ({
        id: item.credentialId,
        transports: item.transports,
      })),
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
    });
    this.registrationChallenges.set(user.userId, options.challenge);
    return options;
  }

  async registrationVerifyForUser(
    userId: string,
    response: RegistrationResponseJSON,
  ): Promise<{ enrolled: true }> {
    const user = this.auth.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Conta não encontrada');
    }
    await this.completeRegistrationVerify(user, response);
    return { enrolled: true };
  }

  async registrationVerify(
    document: string,
    response: RegistrationResponseJSON,
  ): Promise<SessionRecord> {
    const user = this.auth.findUserByDocument(document);
    if (!user) {
      throw new NotFoundException('Conta não encontrada');
    }
    await this.completeRegistrationVerify(user, response);
    return this.auth.issueSessionForUser(user);
  }

  private async completeRegistrationVerify(
    user: { userId: string },
    response: RegistrationResponseJSON,
  ): Promise<void> {
    const expectedChallenge = this.registrationChallenges.get(user.userId);
    if (!expectedChallenge) {
      throw new UnauthorizedException('Cadastro de digital expirado — tente novamente');
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: allowedOrigins(),
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new UnauthorizedException('Touch ID não validou o cadastro');
    }

    const { credential } = verification.registrationInfo;
    const record = toPasskeyRecord({
      credentialId: credential.id,
      publicKey: credential.publicKey,
      counter: credential.counter,
      transports: credential.transports,
    });

    const list = [...this.ancillary.listPasskeys(user.userId), record];
    await this.ancillary.savePasskeys(user.userId, list);
    this.registrationChallenges.delete(user.userId);
  }

  async authenticationOptions(document: string) {
    const user = this.auth.findUserByDocument(document);
    if (!user) {
      throw new NotFoundException('Conta não encontrada');
    }
    const devices = this.ancillary.listPasskeys(user.userId).map(toStoredPasskey);
    if (devices.length === 0) {
      throw new NotFoundException('Nenhuma digital cadastrada para este CPF');
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: devices.map((item) => ({
        id: item.credentialId,
        transports: item.transports,
      })),
      userVerification: 'required',
    });
    this.authenticationChallenges.set(user.userId, options.challenge);
    return options;
  }

  async authenticationVerify(
    document: string,
    response: AuthenticationResponseJSON,
  ): Promise<SessionRecord> {
    const user = this.auth.findUserByDocument(document);
    if (!user) {
      throw new NotFoundException('Conta não encontrada');
    }
    const expectedChallenge = this.authenticationChallenges.get(user.userId);
    if (!expectedChallenge) {
      throw new UnauthorizedException('Sessão biométrica expirada — tente novamente');
    }

    const devices = this.ancillary.listPasskeys(user.userId).map(toStoredPasskey);
    const device = devices.find((item) => item.credentialId === response.id);
    if (!device) {
      throw new UnauthorizedException('Digital não reconhecida');
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: allowedOrigins(),
      expectedRPID: rpID,
      credential: {
        id: device.credentialId,
        publicKey: device.publicKey,
        counter: device.counter,
        transports: device.transports,
      },
      requireUserVerification: true,
    });

    if (!verification.verified) {
      throw new UnauthorizedException('Touch ID não validou');
    }

    await this.ancillary.updatePasskeyCounter(
      user.userId,
      device.credentialId,
      verification.authenticationInfo.newCounter,
    );
    this.authenticationChallenges.delete(user.userId);
    return this.auth.issueSessionForUser(user);
  }
}