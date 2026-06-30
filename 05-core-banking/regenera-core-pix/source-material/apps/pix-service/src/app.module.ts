/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - PIX SERVICE
  Module: Application Root

  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky

  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] app.module.ts

import { Module } from '@nestjs/common';
import { PixModule } from './pix/pix.module';

@Module({
  imports: [PixModule],
})
export class AppModule {}
