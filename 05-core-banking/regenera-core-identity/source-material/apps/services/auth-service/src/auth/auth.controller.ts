/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Auth Controller
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/auth-service/src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Request, Res } from '@nestjs/common'; // Don Paulo: Res e Response, essenciais para gerenciar cookies.
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Response } from 'express'; // Importar Response do 'express' para tipagem.

@ApiTags('Auth')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and get JWT token' })
  @ApiResponse({ status: 200, description: 'User successfully logged in', type: Object })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginUserDto: LoginUserDto, @Res({ passthrough: true }) res: Response) { // Don Paulo: Injetando 'res' para controle total do cookie.
    return this.authService.login(loginUserDto.email, loginUserDto.password, res); // Don Paulo: Passando 'res' para o serviço setar o cookie.
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 409, description: 'Conflict - User already exists' })
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Request() req) {
    return req.user;
  }
}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
