
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';

/**
 * @author Don Paulo Ricardo
 * @description Inicializador de Observabilidade (Tracing Distribuído).
 * Deve ser importado no main.ts antes do bootstrap.
 */
export const startObservability = () => {
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
        // Endpoint do Jaeger/Tempo
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    }),
    instrumentations: [getNodeAutoInstrumentations()],
    serviceName: process.env.SERVICE_NAME || 'regenera-microservice',
  });

  sdk.start();
  console.log('[Observability] OpenTelemetry SDK iniciado com sucesso.');
};
