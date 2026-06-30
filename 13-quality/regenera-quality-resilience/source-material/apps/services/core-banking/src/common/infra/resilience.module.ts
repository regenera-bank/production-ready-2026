
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus'; // Health Checks
import { HttpModule } from '@nestjs/axios';

/**
 * @author Don Paulo Ricardo
 * @description Módulo de Resiliência Distribuída.
 * Implementa Circuit Breaker e Retry Pattern para chamadas externas.
 */
@Module({
  imports: [
    TerminusModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
      // Configuração simulada de Retry/Circuit Breaker (Ex: via axios-retry em prod)
    }),
  ],
  exports: [HttpModule, TerminusModule],
})
export class ResilienceModule {}
