import { Controller, Get, Param } from '@nestjs/common';
import { AddressService } from './address.service';

@Controller('address')
export class AddressController {
  constructor(private readonly address: AddressService) {}

  @Get('cep/:cep')
  lookupCep(@Param('cep') cep: string) {
    return this.address.lookupCep(cep);
  }
}