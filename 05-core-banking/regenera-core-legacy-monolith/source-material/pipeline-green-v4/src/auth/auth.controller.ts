/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';
import { AuthService } from './auth.service';
import { NeuralAuthGuard } from './auth.guard';

class RegisterDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
}

class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}

class NeuralSyncDto {
  @IsString() imageFrame: string;
}

class FirebaseExchangeDto {
  @IsString() idToken: string;
}

class UpdateProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() avatarBase64?: string; // pure base64 or data: URL prefix ok (stripped in service)
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.name, dto.email, dto.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.loginWithEmail(dto.email, dto.password);
  }

  @Post('neural-sync')
  @HttpCode(HttpStatus.OK)
  async neuralSync(@Body() dto: NeuralSyncDto) {
    return this.authService.processBiometricLogin(dto.imageFrame);
  }

  /**
   * Enforces biometric face enrollment and liveness detection.
   *
   * @description Handles client frame validation requests (e.g., from GCPDashboard or LoginPage biometric inputs).
   * Layer Separation Design: Delegates raw image parsing, Google Cloud Vision face annotations, and anti-spoof
   * score calculation to the underlying AuthService.
   *
   * Enforces security standards in alignment with ADR-001 (Biometric-First Identity verification).
   */
  @Post('face-enrollment')
  @HttpCode(HttpStatus.OK)
  async faceEnrollment(@Body() body: any) {
    return this.authService.validateFaceLiveness(body);
  }

  /**
   * Troca um Firebase ID Token (obtido via client SDK createUserWithEmailAndPassword / signInWithEmailAndPassword)
   * por um Neural JWT usado pelo sistema Regenera (para guards, /me, Pix, etc).
   * Permite que o fluxo de "Criar Conta Neural" e Login por email use o Firebase SDK no frontend.
   */
  @Post('exchange')
  @HttpCode(HttpStatus.OK)
  async exchange(@Body() dto: FirebaseExchangeDto) {
    return this.authService.exchangeFirebaseToken(dto.idToken);
  }

  /**
   * Retorna os dados do usuário autenticado.
   * Usado para hidratação de sessão no frontend.
   */
  @Get('me')
  @UseGuards(NeuralAuthGuard)
  async getMe(@Req() req: any) {
    return this.authService.getUserById(req.user.sub);
  }

  /**
   * Atualiza dados básicos do perfil do usuário autenticado (nome, email, telefone, foto).
   * Usa Firebase Admin para persistir em Auth (fonte primária de identidade).
   * Frontend envia avatarBase64 (de <input type="file"> + FileReader) para preview + persist.
   * Retorna o usuário atualizado para hidratar o store imediatamente.
   */
  @Patch('me')
  @UseGuards(NeuralAuthGuard)
  async updateMe(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.sub, dto);
  }

  /**
   * Refresh do access token.
   * Por enquanto faz uma reemissão simples baseada no token atual.
   * Pode evoluir para Refresh Token strategy depois.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(NeuralAuthGuard)
  async refresh(@Req() req: any) {
    return this.authService.refreshToken(req.user);
  }

  @Post('test-token')
  @HttpCode(HttpStatus.OK)
  async getTestToken(@Body() body: { neuralId: string; email: string }) {
    if (
      process.env.NODE_ENV !== 'test' &&
      process.env.NODE_ENV !== 'development'
    ) {
      throw new ForbiddenException(
        'Endpoint restricted to testing environment.',
      );
    }
    return this.authService.generateTestToken(body.neuralId, body.email);
  }
}
