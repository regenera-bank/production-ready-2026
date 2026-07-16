import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import type { SessionRecord } from './auth.service';

export interface FirebaseTokenClaims {
  readonly uid: string;
  readonly email?: string;
  readonly name?: string;
  readonly exp: number;
}

@Injectable()
export class FirebaseAuthService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAuthService.name);
  private ready = false;

  onModuleInit(): void {
    const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
    if (!projectId) {
      this.logger.warn(
        'FIREBASE_PROJECT_ID ausente — autenticação Firebase desativada no BFF',
      );
      return;
    }
    if (!admin.apps.length) {
      admin.initializeApp({ projectId });
    }
    this.ready = true;
    this.logger.log(`Firebase Admin pronto (projectId=${projectId})`);
  }

  isConfigured(): boolean {
    return this.ready;
  }

  async verifyIdToken(idToken: string): Promise<FirebaseTokenClaims> {
    if (!this.ready) {
      throw new ServiceUnavailableException(
        'Firebase não configurado no BFF — defina FIREBASE_PROJECT_ID',
      );
    }
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      return {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
        exp: decoded.exp,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Token Firebase inválido';
      throw new UnauthorizedException(message);
    }
  }

  toSessionRecord(
    token: string,
    claims: FirebaseTokenClaims,
    displayName: string,
    userId: string,
  ): SessionRecord {
    return {
      accessToken: token,
      userId,
      displayName,
      expiresAt: new Date(claims.exp * 1000).toISOString(),
    };
  }
}