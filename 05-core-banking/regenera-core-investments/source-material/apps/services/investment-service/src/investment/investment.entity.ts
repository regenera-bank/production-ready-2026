/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Investment Entities
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/investment-service/src/investment/investment.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ValueTransformer, ManyToOne, OneToMany } from 'typeorm';
import { Money } from '@repo/core';

const moneyTransformer: ValueTransformer = {
  to: (money: Money): number => money.getAmountInCents(),
  from: (amountInCents: number): Money => Money.fromCents(amountInCents),
};

@Entity('investments')
export class Investment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    asset: string;

    @Column('float')
    quantity: number;

    @Column({
        type: 'bigint',
        transformer: moneyTransformer,
    })
    purchasePrice: Money;

    @ManyToOne(() => Portfolio, portfolio => portfolio.investments)
    portfolio: Portfolio;
}

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  name: string;

  @OneToMany(() => Investment, investment => investment.portfolio, { cascade: true, eager: true })
  investments: Investment[];

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
