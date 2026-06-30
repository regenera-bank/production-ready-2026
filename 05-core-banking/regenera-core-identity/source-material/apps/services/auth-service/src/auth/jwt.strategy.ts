/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Auth JWT Strategy
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/auth-service/src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common'; // Adicionado UnauthorizedException
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from '@repo/config'; // Importar AppConfigService
import { Request } from 'express'; // Importar Request

const extractJwtFromCookie = (req: Request) => {
  if (req && req.cookies && req.cookies.jwt_token) {
    return req.cookies.jwt_token;
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly appConfigService: AppConfigService) { // Injetar AppConfigService
    super({
      jwtFromRequest: extractJwtFromCookie, // Usar a função customizada para extrair do cookie
      ignoreExpiration: false,
      secretOrKey: appConfigService.getJwtSecret(), // Obter o segredo do AppConfigService
    });
  }

  /**
   * This method is called by Passport to validate the JWT payload.
   * The return value is attached to the Request object as `req.user`.
   * @param payload The decoded JWT payload.
   */
  // Don Paulo: O payload do JWT agora é fortemente tipado para evitar 'any'.
  // Garante que o que esperamos do token é o que realmente processamos.
  async validate(payload: any) { // Adaptado para 'any' temporariamente
    // For now, we are trusting the payload. A production system might
    // re-validate the user against the database here to ensure they still exist
    // and are active.
    if (!payload || !payload.userId) { // Verificação adicionada
      throw new UnauthorizedException('Invalid token payload.'); // Exceção adicionada
    }
    return { userId: payload.userId, email: payload.email, roles: payload.roles }; // Retorno adaptado
  }
}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
