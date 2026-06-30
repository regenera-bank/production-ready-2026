/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Card Controller
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/card-service/src/card/card.controller.ts
import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Card } from './card.entity'; // For type reference

@ApiTags('Cards')
@UseGuards(JwtAuthGuard)
@Controller('cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new card for the authenticated user' })
  @ApiResponse({ status: 201, description: 'Card successfully created', type: Card })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - User ID mismatch' })
  createCard(@Body() createCardDto: CreateCardDto, @Request() req) {
    if (req.user.userId !== createCardDto.userId) {
      throw new Error('Unauthorized operation.'); // Or use ForbiddenException
    }
    return this.cardService.create(createCardDto);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Retrieve all cards for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of cards retrieved', type: [Card] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getCards(@Request() req) {
    return this.cardService.findByUserId(req.user.userId);
  }

  @Patch(':id/status')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update the status of a specific card' })
  @ApiResponse({ status: 200, description: 'Card status updated', type: Card })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Card not found for this user' })
  updateCardStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateCardStatusDto,
    @Request() req,
  ) {
    return this.cardService.updateStatus(id, req.user.userId, updateDto.status);
  }
}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/