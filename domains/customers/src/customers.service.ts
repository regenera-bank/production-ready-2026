import { Inject, Injectable } from '@nestjs/common';
import { CUSTOMERS_PORT, CustomersCommand, CustomersPort, CustomersResult } from './ports/customers.port';

@Injectable()
export class CustomersService {
  constructor(@Inject(CUSTOMERS_PORT) private readonly port: CustomersPort) {}

  health() {
    return this.port.health();
  }

  execute(command: CustomersCommand): Promise<CustomersResult> {
    return this.port.execute(command);
  }
}
