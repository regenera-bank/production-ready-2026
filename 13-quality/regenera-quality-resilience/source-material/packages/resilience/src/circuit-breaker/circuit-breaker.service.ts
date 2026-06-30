/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Resilience - Circuit Breaker Service
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] packages/resilience/src/circuit-breaker/circuit-breaker.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import Circuit, * as opossum from 'opossum';

@Injectable()
export class CircuitBreakerService implements OnModuleInit {
  private circuit: Circuit;
  private readonly name: string;
  private readonly options: opossum.Options;

  constructor(name: string, options?: opossum.Options) {
    this.name = name;
    this.options = {
      timeout: 3000, // If our service takes longer than 3 seconds, trigger a failure
      errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
      resetTimeout: 30000, // After 30 seconds, try again
      ...options,
    };
  }

  onModuleInit() {
    this.circuit = new Circuit(async (func: Function, ...args: any[]) => func(...args), this.options);

    this.circuit.on('open', () => console.warn(`Circuit Breaker [${this.name}] OPEN`));
    this.circuit.on('close', () => console.log(`Circuit Breaker [${this.name}] CLOSED`));
    this.circuit.on('halfOpen', () => console.log(`Circuit Breaker [${this.name}] HALF-OPEN`));
    this.circuit.on('timeout', () => console.warn(`Circuit Breaker [${this.name}] TIMEOUT`));
    this.circuit.on('reject', () => console.error(`Circuit Breaker [${this.name}] REJECTED`));
  }

  /**
   * Executes a function through the circuit breaker.
   * @param func The function to execute.
   * @param args Arguments for the function.
   * @returns The result of the function or a fallback.
   */
  async execute<T>(func: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
    return this.circuit.fire(func, ...args);
  }
}
