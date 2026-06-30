/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Auth Root Module
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/auth-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { USER_SERVICE_NAME } from '@repo/grpc-definitions';
import { AppConfigModule, AppConfigService } from '@repo/config'; // Don Paulo: Importando nosso módulo de config central.

@Module({
  imports: [
    // Don Paulo: Módulo de config primeiro. Ele é global, mas é boa prática ser explícito.
    AppConfigModule,
    // Don Paulo: Registrando o cliente gRPC de forma assíncrona.
    // Isso permite injetar dependências (como o AppConfigService) para configurar o cliente.
    ClientsModule.registerAsync([
      {
        name: USER_SERVICE_NAME,
        imports: [AppConfigModule], // Garante que o AppConfigModule está disponível neste contexto.
        useFactory: (configService: AppConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'user',
            protoPath: join(__dirname, '../../../packages/grpc-definitions/src/user.proto'),
            // Don Paulo: A URL agora vem da nossa fonte de verdade central. Sem hardcoding.
            url: configService.get('USER_SERVICE_URL'),
          },
        }),
        inject: [AppConfigService], // Injeta o serviço de config na nossa factory.
      },
    ]),
    AuthModule,
  ],
})
export class AppModule {}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
