/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Resilience - Circuit Breaker Module
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] packages/resilience/src/circuit-breaker/circuit-breaker.module.ts
import { Module, DynamicModule } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker.service';

export interface CircuitBreakerModuleOptions {
  // Configuration options for the circuit breaker, e.g., timeout, errorThresholdPercentage
  // These would be passed to the opossum library
  name: string; // Unique name for the circuit breaker
  options?: any; // Opossum options
}

@Module({})
export class CircuitBreakerModule {
  static register(options: CircuitBreakerModuleOptions): DynamicModule {
    return {
      module: CircuitBreakerModule,
      providers: [
        {
          provide: `CIRCUIT_BREAKER_${options.name.toUpperCase()}`, // Unique token
          useFactory: () => new CircuitBreakerService(options.name, options.options),
        },
      ],
      exports: [`CIRCUIT_BREAKER_${options.name.toUpperCase()}`],
    };
  }
}
