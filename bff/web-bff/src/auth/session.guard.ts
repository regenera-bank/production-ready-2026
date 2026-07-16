import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { FirebaseAuthService } from './firebase-auth.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly firebase: FirebaseAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) {
      throw new UnauthorizedException('Sessão ausente');
    }
    try {
      if (this.auth.isHomologSessionToken(token)) {
        const session = await this.auth.resolveSession(token);
        (request as Request & { session: unknown }).session = session;
        return true;
      }
      const claims = await this.firebase.verifyIdToken(token);
      const user =
        this.auth.findUserByFirebaseUid(claims.uid) ??
        this.auth.syncFirebaseUser(
          claims.uid,
          claims.email ?? '',
          claims.name,
        );
      const session = this.firebase.toSessionRecord(
        token,
        claims,
        user.displayName,
        user.userId,
      );
      (request as Request & { session: unknown }).session = session;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Sessão inválida');
    }
  }
}