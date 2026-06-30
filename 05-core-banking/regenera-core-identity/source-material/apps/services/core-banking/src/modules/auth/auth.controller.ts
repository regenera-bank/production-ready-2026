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

// [FILE] auth.controller.ts

import { Controller, Post, Body, Res, ValidationPipe } from '@nestjs/common';
import { Throttle } from 'nestjs-throttler';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body(new ValidationPipe()) registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  /**
   * @description Endpoint de login. Após autenticação bem-sucedida,
   *              armazena o JWT em um cookie httpOnly, seguro contra XSS.
   *              Protegido com um Rate Limit mais estrito para evitar brute force.
   * @param res - Objeto de resposta do Express, injetado para manipular cookies.
   * @param loginDto - DTO com as credenciais.
   */
  @Throttle({ default: { limit: 5, ttl: 60000 }}) // [SEC-004] 5 tentativas por minuto
  @Post('login')
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body(new ValidationPipe()) loginDto: LoginDto,
  ) {
    const { accessToken } = await this.authService.login(loginDto);

    // [BUG #4 CORRIGIDO] Especificar path e domain para o cookie.
    res.cookie('access_token', accessToken, {
      httpOnly: true, // Impede acesso via JavaScript no cliente (defesa contra XSS).
      secure: process.env.NODE_ENV === 'production', // Enviar apenas em HTTPS em produção.
      sameSite: 'strict', // Mitigação robusta contra ataques CSRF.
      maxAge: 15 * 60 * 1000, // 15 minutos, igual à expiração do token.
      path: '/', // Garante que o cookie seja válido para todo o site.
      domain: process.env.COOKIE_DOMAIN || undefined, // Ex: '.regenerabank.com' em produção
    });

    // Fallback visual simples, sem overengineering aqui.
    return { status: 'Login successful' };
  }
}
