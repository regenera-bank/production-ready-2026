/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: PIX Controller
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/pix-service/src/pix/pix.controller.ts
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common'; // Import Request
import { PixService } from './pix.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('transfers')
export class PixController {
  constructor(private readonly pixService: PixService) {}

  @Post()
  createTransfer(@Body() createTransferDto: CreateTransferDto, @Request() req) {
    // req.user contains the payload from the JWT.
    // In a real app, we would verify that the authenticated user
    // is the owner of the sourceAccountId.
    return this.pixService.createTransfer(createTransferDto, req.user.userId);
  }
}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
