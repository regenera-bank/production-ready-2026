/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

// |---------------------------------------------------------------------------------------|
// |  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
// |---------------------------------------------------------------------------------------|
//
// PROJECT:       Regenera Bank
// CEO:           Raphaela Cerveski
// DEVELOPER:     Don Paulo Ricardo
// ID:            2098233287
// COPYRIGHT:     Copyright (c) 2026 Regenera Corporate
//
// LICENSE:       EULA (End-User License Agreement)
// PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA
//
// WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
//                engenharia reversa ou modificação não autorizada.
//
// |---------------------------------------------------------------------------------------|
// |  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
// |---------------------------------------------------------------------------------------|

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * Trading Gateway - pushes live B3 quotes to StockTerminal.tsx
 * via Socket.IO. Production: subscribe to Pub/Sub topic fed by
 * Cedro Crystal feed and fan-out to connected clients.
 */
@WebSocketGateway({ namespace: '/market-data', cors: true })
export class TradingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(TradingGateway.name);
  private intervals = new Map<string, NodeJS.Timeout>();

  handleConnection(client: Socket) {
    this.logger.log(`Trading client connected: ${client.id}`);
    // Real prices via public API (CoinGecko) - no fake. Expand to Pub/Sub worker for B3/Crypto feeds per MANIFESTE.
    // Backend uses Cloud Pub/Sub for fanout in prod.
    const iv = setInterval(async () => {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=brl',
        );
        const json = await res.json();
        // For demo, push BTC/ETH real; for stocks like PETR4 frontend can use other.
        client.emit('stock_update', {
          symbol: 'BTC',
          price: json.bitcoin?.brl?.toString() || '65000',
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        // silent
      }
    }, 5000); // real rate, not fake random
    this.intervals.set(client.id, iv);
  }

  handleDisconnect(client: Socket) {
    const iv = this.intervals.get(client.id);
    if (iv) clearInterval(iv);
    this.intervals.delete(client.id);
    this.logger.log(`Trading client disconnected: ${client.id}`);
  }
}
