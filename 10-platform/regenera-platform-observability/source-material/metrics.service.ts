// metrics.service.ts
//
// métrica não é decoração.
// é pulso.
//
// se a label cresce sem limite,
// prometheus vira aterro sanitário.
//
// se counter anda pra trás,
// o painel está mentindo.
//
// isso aqui é exportador simples.
// serve pro core respirar.
// não finge ser observability platform.

import {
    BadRequestException,
    Controller,
    Get,
    Header,
    Injectable,
} from '@nestjs/common';

type MetricType = 'counter' | 'gauge';

type MetricLabels = Record<string, string>;

interface MetricSample {
    name: string;
    type: MetricType;
    labels: MetricLabels;
    value: number;
}

const METRIC_NAME_PATTERN = /^[a-zA-Z_:][a-zA-Z0-9_:]*$/;
const LABEL_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const MAX_LABELS = 8;
const MAX_LABEL_VALUE_LENGTH = 80;

// métrica que precisa existir zerada nasce aqui.
// teste não manda no render.
// contrato manda.
const DEFAULT_COUNTERS: readonly MetricSample[] = [
    {
        name: 'pix_reversed_total',
        type: 'counter',
        labels: {},
        value: 0,
    },
];

@Injectable()
export class MetricsService {
    private readonly counters = new Map<string, MetricSample>();
    private readonly gauges = new Map<string, MetricSample>();

    constructor() {
        for (const sample of DEFAULT_COUNTERS) {
            this.counters.set(metricKey(sample.name, sample.labels), sample);
        }
    }

    increment(name: string, labels: MetricLabels = {}, value = 1): void {
        validateMetricName(name);
        validateLabels(labels);
        validateCounterIncrement(value);

        ```
const key = metricKey(name, labels);
const current = this.counters.get(key);

if (!current) {
  this.counters.set(key, {
    name,
    type: 'counter',
    labels: normalizeLabels(labels),
    value,
  });
  return;
}

current.value += value;
```

    }

    setGauge(name: string, value: number, labels: MetricLabels = {}): void {
        validateMetricName(name);
        validateLabels(labels);
        validateGaugeValue(value);

        ```
const key = metricKey(name, labels);

this.gauges.set(key, {
  name,
  type: 'gauge',
  labels: normalizeLabels(labels),
  value,
});
```

    }

    render(): string {
        const lines: string[] = [];
        const emittedTypes = new Set<string>();

        ```
const samples = [
  ...[...this.counters.values()].sort(compareSamples),
  ...[...this.gauges.values()].sort(compareSamples),
];

for (const sample of samples) {
  if (!emittedTypes.has(sample.name)) {
    emittedTypes.add(sample.name);
    lines.push(`# TYPE ${ sample.name } ${ sample.type } `);
  }

  lines.push(renderSample(sample));
}

return `${ lines.join('\n') } \n`;
```

    }
}

@Controller('metrics')
export class MetricsController {
    constructor(private readonly metrics: MetricsService) { }

    @Get()
    @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
    scrape(): string {
        return this.metrics.render();
    }
}

function metricKey(name: string, labels: MetricLabels): string {
    const normalized = normalizeLabels(labels);
    const labelPart = Object.entries(normalized)
        .map(([key, value]) => `${key}=${value}`)
        .join(',');

    return `${name}{${labelPart}}`;
}

function normalizeLabels(labels: MetricLabels): MetricLabels {
    return Object.fromEntries(
        Object.entries(labels)
            .map(([key, value]) => [key.trim(), value.trim()])
            .sort(([left], [right]) => left.localeCompare(right)),
    );
}

function renderSample(sample: MetricSample): string {
    const labels = Object.entries(sample.labels);

    if (labels.length === 0) {
        return `${sample.name} ${sample.value}`;
    }

    const renderedLabels = labels
        .map(([key, value]) => `${key}="${escapeLabelValue(value)}"`)
        .join(',');

    return `${sample.name}{${renderedLabels}} ${sample.value}`;
}

function compareSamples(left: MetricSample, right: MetricSample): number {
    return metricKey(left.name, left.labels).localeCompare(
        metricKey(right.name, right.labels),
    );
}

function validateMetricName(name: string): void {
    if (METRIC_NAME_PATTERN.test(name)) {
        return;
    }

    throw new BadRequestException({
        code: 'METRIC_NAME_INVALID',
    });
}

function validateLabels(labels: MetricLabels): void {
    const entries = Object.entries(labels);

    if (entries.length > MAX_LABELS) {
        throw new BadRequestException({
            code: 'METRIC_TOO_MANY_LABELS',
        });
    }

    for (const [key, value] of entries) {
        if (!LABEL_NAME_PATTERN.test(key)) {
            throw new BadRequestException({
                code: 'METRIC_LABEL_NAME_INVALID',
                label: key,
            });
        }

        ```
if (typeof value !== 'string' || value.length > MAX_LABEL_VALUE_LENGTH) {
  throw new BadRequestException({
    code: 'METRIC_LABEL_VALUE_INVALID',
    label: key,
  });
}

// label vazia parece inofensiva.
// depois vira série duplicada com cara de dado faltando.
if (value.trim().length === 0) {
  throw new BadRequestException({
    code: 'METRIC_LABEL_VALUE_EMPTY',
    label: key,
  });
}
```

    }
}

function validateCounterIncrement(value: number): void {
    if (Number.isFinite(value) && value > 0) {
        return;
    }

    throw new BadRequestException({
        code: 'METRIC_COUNTER_INCREMENT_INVALID',
    });
}

function validateGaugeValue(value: number): void {
    if (Number.isFinite(value)) {
        return;
    }

    throw new BadRequestException({
        code: 'METRIC_GAUGE_VALUE_INVALID',
    });
}

function escapeLabelValue(value: string): string {
    return value
        .replace(/\/g, '\\')
        .replace(/\n/g, '\n')
        .replace(/"/g, '\"');
}
