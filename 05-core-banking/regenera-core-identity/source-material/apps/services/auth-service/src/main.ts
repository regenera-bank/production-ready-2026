/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Auth Service Entrypoint
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/auth-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet'; // Importado por Don Paulo, segurança em primeiro lugar.

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Don Paulo aqui: Adicionando o capacete de guerra. Segurança não é brincadeira.
  // CSP, HSTS, e o resto do arsenal. Injetando agora.
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"], // Don Paulo: Adeus 'unsafe-inline'. Segurança em primeiro lugar. Nada de script inesperado.
      },
    },
    hsts: {
      maxAge: 31536000, // 1 ano. Trava isso no browser do cliente, garantindo HTTPS.
      includeSubDomains: true,
      preload: true,
    },
  }));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // This service runs on port 3001, as expected by the API Gateway.
  await app.listen(3001);
}
bootstrap();
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
