import { Inject, Injectable } from '@nestjs/common';
import { ORDERS_PORT, OrdersCommand, OrdersPort, OrdersResult } from './ports/orders.port';

@Injectable()
export class OrdersService {
  constructor(@Inject(ORDERS_PORT) private readonly port: OrdersPort) {}

  health() {
    return this.port.health();
  }

  execute(command: OrdersCommand): Promise<OrdersResult> {
    return this.port.execute(command);
  }
}
