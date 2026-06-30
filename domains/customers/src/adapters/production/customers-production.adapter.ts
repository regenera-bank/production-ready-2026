import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  CustomersAdapterKind,
  CustomersCommand,
  CustomersHealth,
  CustomersPort,
  CustomersResult,
} from '../../ports/customers.port';

@Injectable()
export class CustomersProductionAdapter implements CustomersPort {
  readonly kind: CustomersAdapterKind = 'production';

  async health(): Promise<CustomersHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('customers', 'production');
  }

  async execute(_command: CustomersCommand): Promise<CustomersResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('customers', 'production');
  }
}
