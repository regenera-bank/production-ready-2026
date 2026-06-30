import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

export interface CepLookupResult {
  readonly postalCode: string;
  readonly street: string;
  readonly complement?: string;
  readonly neighborhood: string;
  readonly city: string;
  readonly state: string;
  readonly ibge?: string;
  readonly source: 'viacep';
}

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  erro?: boolean;
}

const formatCep = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

@Injectable()
export class AddressService {
  async lookupCep(rawCep: string): Promise<CepLookupResult> {
    const digits = rawCep.replace(/\D/g, '');
    if (digits.length !== 8) {
      throw new BadRequestException('CEP deve conter 8 dígitos');
    }

    let payload: ViaCepResponse;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) {
        throw new Error(`ViaCEP HTTP ${response.status}`);
      }
      payload = (await response.json()) as ViaCepResponse;
    } catch {
      throw new NotFoundException('Serviço de CEP indisponível no momento');
    }

    if (payload.erro || !payload.localidade || !payload.uf) {
      throw new NotFoundException('CEP não encontrado');
    }

    return {
      postalCode: formatCep(payload.cep ?? digits),
      street: payload.logradouro?.trim() ?? '',
      complement: payload.complemento?.trim() || undefined,
      neighborhood: payload.bairro?.trim() ?? '',
      city: payload.localidade.trim(),
      state: payload.uf.trim().toUpperCase(),
      ibge: payload.ibge,
      source: 'viacep',
    };
  }
}