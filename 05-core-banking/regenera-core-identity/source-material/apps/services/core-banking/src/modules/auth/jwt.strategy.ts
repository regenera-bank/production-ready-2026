/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Authentication

  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky

  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

// // DEV NOTE: Dependências externas.
// // Adicionar ao package.json: `npm i @nestjs/passport passport passport-jwt && npm i -D @types/passport-jwt`

/**
 * @description Estratégia de validação de JWT.
 *              Extrai o token do cookie 'access_token', valida sua assinatura
 *              e garante que o payload esteja no formato correto.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extrai o token do cookie httpOnly que setamos no login.
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          return request?.cookies?.access_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret-para-dev-nao-usar-em-prod',
    });
  }

  /**
   * @description Método de validação executado pelo Passport após a verificação da assinatura do token.
   * @param payload O payload decodificado do JWT.
   * @returns O objeto de usuário simplificado que será anexado ao `request.user`.
   */
  async validate(payload: { userId: string; email: string; roles?: string[] }) {
    // [BUG #1 CORRIGIDO] A validação agora espera o payload correto: { userId, email, roles }.
    if (!payload || !payload.userId) {
      throw new UnauthorizedException('Token com payload inválido.');
    }
    
    // O objeto retornado aqui será o `request.user` nos controllers protegidos.
    return {
      userId: payload.userId,
      email: payload.email,
      roles: payload.roles || [],
    };
  }
}
