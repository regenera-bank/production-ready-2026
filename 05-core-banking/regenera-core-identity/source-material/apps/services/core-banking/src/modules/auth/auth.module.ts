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

// [FILE] auth.module.ts

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService, AppConfigService, UserService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AppConfigService, UserService],
})
export class AuthModule {}
