/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Auth Module
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/auth-service/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AppConfigModule, AppConfigService } from '@repo/config'; // Import AppConfigModule and Service
import { HttpModule } from '@nestjs/axios'; // Required for AuthService REST calls

@Module({
  imports: [
    AppConfigModule, // Import AppConfigModule here
    PassportModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule], // Make AppConfigService available
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        secret: configService.getJwtSecret(), // Get secret from AppConfigService
        signOptions: { expiresIn: '3600s' }, // Tokens expire in 1 hour
      }),
    }),
    HttpModule, // Import HttpModule for AuthService REST calls
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
