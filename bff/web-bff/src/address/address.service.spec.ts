import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { AddressService } from './address.service';

describe('AddressService', () => {
  const service = new AddressService();
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('rejeita CEP inválido', async () => {
    await expect(service.lookupCep('123')).rejects.toThrow(BadRequestException);
  });

  it('resolve CEP via ViaCEP', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        cep: '88064-002',
        logradouro: 'Rodovia Baldicero Filomeno',
        bairro: 'Ribeirão da Ilha',
        localidade: 'Florianópolis',
        uf: 'SC',
        ibge: '4205407',
      }),
    }) as unknown as typeof fetch;

    const result = await service.lookupCep('88064002');
    expect(result.source).toBe('viacep');
    expect(result.city).toBe('Florianópolis');
    expect(result.state).toBe('SC');
  });

  it('faz fallback para BrasilAPI quando ViaCEP falha', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('ViaCEP down'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cep: '88064002',
          street: 'Rodovia Baldicero Filomeno',
          neighborhood: 'Ribeirão da Ilha',
          city: 'Florianópolis',
          state: 'SC',
        }),
      }) as unknown as typeof fetch;

    const result = await service.lookupCep('88064002');
    expect(result.source).toBe('brasilapi');
    expect(result.street).toContain('Baldicero');
  });

  it('retorna 503 quando ambos provedores falham', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

    await expect(service.lookupCep('88064002')).rejects.toThrow(ServiceUnavailableException);
  });
});