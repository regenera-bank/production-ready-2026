import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

export interface CreatePaymentIntentInput {
  readonly productId: string;
  readonly externalId: string;
  readonly amount: string;
  readonly currency: string;
  readonly concept?: string;
  readonly reference?: string;
  readonly username?: string;
  readonly documentNumber?: string;
  readonly userTaxId?: string;
}

export interface PaymentIntentCreated {
  readonly intentId: string;
  readonly externalId?: string;
  readonly concept?: string;
  readonly currency: string;
  readonly amount: string;
}

interface PaymentIntentApiResponse {
  readonly intent_id?: string;
  readonly external_id?: string;
  readonly concept?: string;
  readonly currency?: string;
  readonly amount?: string;
  readonly detail?: string;
  readonly message?: string;
}

@Injectable()
export class PrometeoPaymentsClient {
  private readonly logger = new Logger(PrometeoPaymentsClient.name);

  private resolveBaseUrl(): string {
    return (
      process.env.PROMETEO_PAYMENTS_BASE_URL?.trim() ||
      'https://payment.prometeoapi.net'
    ).replace(/\/$/, '');
  }

  private resolveApiKey(): string {
    const apiKey = process.env.PROMETEO_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException('PROMETEO_API_KEY ausente');
    }
    return apiKey;
  }

  resolveWidgetProductId(): string {
    const widgetId = process.env.PROMETEO_WIDGET_ID?.trim();
    if (!widgetId) {
      throw new BadRequestException(
        'PROMETEO_WIDGET_ID ausente — configure o product_id do widget no BFF',
      );
    }
    return widgetId;
  }

  async createPaymentIntent(
    input: CreatePaymentIntentInput,
  ): Promise<PaymentIntentCreated> {
    const baseUrl = this.resolveBaseUrl();
    const apiKey = this.resolveApiKey();

    const payload: Record<string, string> = {
      product_id: input.productId,
      product_type: 'widget',
      external_id: input.externalId,
      currency: input.currency,
      amount: input.amount,
    };

    if (input.concept?.trim()) {
      payload.concept = input.concept.trim().slice(0, 20);
    }
    if (input.reference?.trim()) {
      payload.reference = input.reference.trim().slice(0, 128);
    }
    if (input.username?.trim()) {
      payload.username = input.username.trim().slice(0, 50);
    }
    if (input.documentNumber?.trim()) {
      payload.document_number = input.documentNumber.trim().slice(0, 50);
    }
    if (input.userTaxId?.trim()) {
      payload.user_tax_id = input.userTaxId.replace(/\D/g, '').slice(0, 11);
    }

    const response = await fetch(`${baseUrl}/api/v1/payment-intent/`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
    });

    const body = (await this.readJson(response)) as PaymentIntentApiResponse;
    if (!response.ok || !body.intent_id) {
      const detail = body.detail ?? body.message ?? JSON.stringify(body);
      this.logger.warn(
        `[Prometeo Payments] intent falhou ${response.status}: ${detail}`,
      );
      throw new ServiceUnavailableException(
        `Prometeo Payment Intent falhou (${response.status}): ${detail}`,
      );
    }

    this.logger.log(
      `[Prometeo Payments] intent criado ${body.intent_id} (${input.amount} ${input.currency})`,
    );

    return {
      intentId: body.intent_id,
      externalId: body.external_id,
      concept: body.concept,
      currency: body.currency ?? input.currency,
      amount: body.amount ?? input.amount,
    };
  }

  private async readJson(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text.trim()) {
      return {};
    }
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { raw: text.slice(0, 200) };
    }
  }
}