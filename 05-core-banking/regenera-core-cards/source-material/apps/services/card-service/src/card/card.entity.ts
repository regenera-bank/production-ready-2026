/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Card Entity
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/card-service/src/card/card.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CardStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  EXPIRED = 'EXPIRED',
}

export enum CardType {
  VIRTUAL = 'VIRTUAL',
  PHYSICAL = 'PHYSICAL',
}

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  accountId: string;

  // Don Paulo: PCI-DSS compliance. NUNCA armazenar dados de cartão sensíveis.
  // Usar tokenização é a única forma segura e conforme.
  @Column({ length: 255 }) // Token pode ser um hash longo
  tokenizedCardId: string; // ✅ Token do provedor de pagamento (Stripe/Adyen)

  @Column({ length: 4 })
  last4: string; // ✅ Últimos 4 dígitos para display, não sensível.

  @Column()
  brand: string; // ✅ Bandeira do cartão (Visa, Mastercard, etc.)

  @Column()
  cardHolderName: string;

  @Column({ nullable: true }) // Expiração pode ser inferida do token ou opcional
  expirationDate: string; // ✅ Manter para display, se disponível no token.

  @Column({ type: 'enum', enum: CardStatus, default: CardStatus.ACTIVE })
  status: CardStatus;

  @Column({ type: 'enum', enum: CardType })
  type: CardType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
