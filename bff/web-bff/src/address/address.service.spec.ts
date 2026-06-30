import { BadRequestException } from '@nestjs/common';
import { AddressService } from './address.service';

describe('AddressService', () => {
  const service = new AddressService();

  it('rejeita CEP inválido', async () => {
    await expect(service.lookupCep('123')).rejects.toThrow(BadRequestException);
  });
});