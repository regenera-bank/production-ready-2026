import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

interface SpanContext {
  traceId: string;
  spanId: string;
  operation: string;
  startTime: number;
}

@Injectable()
export class TracingService {
  private readonly logger = new Logger(TracingService.name);
  private readonly als = new AsyncLocalStorage<SpanContext>();

  startSpan(name: string, attributes?: Record<string, any>) {
    const traceId = this.getCurrentTraceId() || randomUUID();
    const spanId = randomUUID();
    const startTime = Date.now();

    const spanContext: SpanContext = {
      traceId,
      spanId,
      operation: name,
      startTime,
    };
    this.als.enterWith(spanContext);

    this.logger.log(
      JSON.stringify({
        event: 'span_start',
        traceId,
        spanId,
        operation: name,
        attributes,
      }),
    );
  }

  endSpan() {
    const context = this.als.getStore();
    if (!context) return;

    const durationMs = Date.now() - context.startTime;
    this.logger.log(
      JSON.stringify({
        event: 'span_end',
        traceId: context.traceId,
        spanId: context.spanId,
        operation: context.operation,
        durationMs,
      }),
    );
  }

  getCurrentTraceId(): string | undefined {
    return this.als.getStore()?.traceId;
  }

  getCurrentSpanId(): string | undefined {
    return this.als.getStore()?.spanId;
  }
}
