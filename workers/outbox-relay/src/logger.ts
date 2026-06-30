/** Log estruturado com correlationId — rastreio ponta a ponta no relay */
export interface LogContext {
  correlationId: string;
  outboxEventId?: string;
  jobId?: string;
  attempt?: number;
  outboxStore?: 'postgres' | 'memory';
  nodeEnv?: string;
}

export function logInfo(message: string, context: LogContext): void {
  console.log(
    JSON.stringify({
      level: 'info',
      message,
      ...context,
      ts: new Date().toISOString(),
    }),
  );
}

export function logWarn(message: string, context: LogContext): void {
  console.warn(
    JSON.stringify({
      level: 'warn',
      message,
      ...context,
      ts: new Date().toISOString(),
    }),
  );
}

export function logError(
  message: string,
  context: LogContext,
  error?: unknown,
): void {
  const err =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;

  console.error(
    JSON.stringify({
      level: 'error',
      message,
      error: err,
      ...context,
      ts: new Date().toISOString(),
    }),
  );
}