/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Card DTOs
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/card-service/src/card/dto/create-card.dto.ts
import { IsEnum, IsNotEmpty, IsString, Length, Matches } from 'class-validator'; // Adicionado Length, Matches
import { ApiProperty } from '@nestjs/swagger';
import { CardType } from '../card.entity';

export class CreateCardDto {
  @ApiProperty({ description: 'ID of the user to whom the card belongs.', example: 'user-uuid-123' })
  @IsString()
  @IsNotEmpty()
  userId: string;
  
  @ApiProperty({ description: 'ID of the account to which the card is linked.', example: 'account-uuid-456' })
  @IsString()
  @IsNotEmpty()
  accountId: string;

  // Don Paulo: Estes campos são para tokenização e NUNCA serão persistidos diretamente.
  // Eles são validados aqui para garantir a integridade ANTES de serem enviados ao tokenizer.
  @ApiProperty({ description: 'Full credit card number.', example: '4111222233334444' })
  @IsString()
  @IsNotEmpty()
  @Length(16, 16, { message: 'Card number must be 16 digits long.' })
  @Matches(/^[0-9]+$/, { message: 'Card number must contain only digits.' })
  cardNumber: string;

  @ApiProperty({ description: 'Card expiration month (MM).', example: '12' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 2, { message: 'Expiration month must be 2 digits long.' })
  @Matches(/^(0[1-9]|1[0-2])$/, { message: 'Expiration month must be a valid month (01-12).' })
  expirationMonth: string;

  @ApiProperty({ description: 'Card expiration year (YY).', example: '25' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 2, { message: 'Expiration year must be 2 digits long.' })
  @Matches(/^[0-9]+$/, { message: 'Expiration year must contain only digits.' })
  expirationYear: string;

  @ApiProperty({ description: 'Card Verification Value (CVC/CVV).', example: '123' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 4, { message: 'CVC must be 3 or 4 digits long.' })
  @Matches(/^[0-9]+$/, { message: 'CVC must contain only digits.' })
  cvc: string;

  @ApiProperty({ description: 'Full name of the cardholder.', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  cardHolderName: string;
  
  @ApiProperty({ description: 'Type of the card (Credit or Debit).', enum: CardType, example: CardType.VIRTUAL })
  @IsEnum(CardType)
  @IsNotEmpty()
  type: CardType;
}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/