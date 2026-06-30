/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class StreamBufferManager<T> {
  private buffer: T[] = [];
  private readonly maxSize = 500;
  private readonly flushInterval = 5000; // 5 seconds
  private flushCallback: (entries: T[]) => Promise<void>;
  private timer: NodeJS.Timeout;

  constructor() {
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }

  onFlush(callback: (entries: T[]) => Promise<void>) {
    this.flushCallback = callback;
  }

  add(entry: T) {
    this.buffer.push(entry);
    if (this.buffer.length >= this.maxSize) {
      this.flush();
    }
  }

  private async flush() {
    if (this.buffer.length === 0 || !this.flushCallback) return;

    const dataToFlush = [...this.buffer];
    this.buffer = [];

    await this.flushCallback(dataToFlush);
  }
}
