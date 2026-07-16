import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

export type CepLookupSource = 'viacep' | 'brasilapi';

export interface CepLookupResult {
  readonly postalCode: string;
  readonly street: string;
  readonly complement?: string;
  readonly neighborhood: string;
  readonly city: string;
  readonly state: string;
  readonly ibge?: string;
  readonly source: CepLookupSource;
}

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  erro?: boolean | string;
}

interface BrasilApiCepResponse {
  cep?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

const formatCep = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const asTrimmedString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const fetchJson = async <T>(url: string, timeoutMs = 8_000): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
};

@Injectable()
export class AddressService {
  async lookupCep(rawCep: string): Promise<CepLookupResult> {
    const digits = rawCep.replace(/\D/g, '');
    if (digits.length !== 8) {
      throw new BadRequestException('CEP deve conter 8 dígitos');
    }

    const viaCep = await this.tryViaCep(digits);
    if (viaCep) {
      return viaCep;
    }

    const brasilApi = await this.tryBrasilApi(digits);
    if (brasilApi) {
      return brasilApi;
    }

    throw new ServiceUnavailableException(
      'Consulta de CEP indisponível (ViaCEP e BrasilAPI)',
    );
  }

  private async tryViaCep(digits: string): Promise<CepLookupResult | null> {
    try {
      const payload = await fetchJson<ViaCepResponse>(
        `https://viacep.com.br/ws/${digits}/json/`,
      );
      if (payload.erro === true || payload.erro === 'true') {
        return null;
      }
      const city = asTrimmedString(payload.localidade);
      const state = asTrimmedString(payload.uf).toUpperCase();
      if (!city || state.length !== 2) {
        return null;
      }
      return {
        postalCode: formatCep(payload.cep ?? digits),
        street: asTrimmedString(payload.logradouro),
        complement: asTrimmedString(payload.complemento) || undefined,
        neighborhood: asTrimmedString(payload.bairro),
        city,
        state,
        ibge: asTrimmedString(payload.ibge) || undefined,
        source: 'viacep',
      };
    } catch {
      return null;
    }
  }

  private async tryBrasilApi(digits: string): Promise<CepLookupResult | null> {
    try {
      const payload = await fetchJson<BrasilApiCepResponse>(
        `https://brasilapi.com.br/api/cep/v1/${digits}`,
      );
      const city = asTrimmedString(payload.city);
      const state = asTrimmedString(payload.state).toUpperCase();
      if (!city || state.length !== 2) {
        return null;
      }
      return {
        postalCode: formatCep(payload.cep ?? digits),
        street: asTrimmedString(payload.street),
        neighborhood: asTrimmedString(payload.neighborhood),
        city,
        state,
        source: 'brasilapi',
      };
    } catch {
      return null;
    }
  }
}