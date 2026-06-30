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
import { OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PubSub } from '@google-cloud/pubsub';

/**
 * PixEventsGateway - pushes real-time PIX events (sent/received) to connected clients.
 * Frontend (HomeScreen, PixPage) can listen for 'PIX_RECEIVED' to update balance live.
 * Production: subscribe to Pub/Sub 'pix-events' topic and fan-out via socket.
 */
@WebSocketGateway({ namespace: '/pix-events', cors: true })
export class PixEventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(PixEventsGateway.name);
  private connectedClients = new Set<string>();
  private pubsub = new PubSub({
    projectId: process.env.GCP_PROJECT_ID || 'regenera-bank-prod',
  });

  handleConnection(client: Socket) {
    this.connectedClients.add(client.id);
    this.logger.log(`Pix client connected: ${client.id}`);
    // Optional: client can send subscribe for specific neuralId
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Pix client disconnected: ${client.id}`);
  }

  async onModuleInit() {
    this.logger.log(
      'Setting up Pub/Sub subscription for pix-events fanout to socket...',
    );
    const topicName = 'pix-events';
    const subscriptionName = 'pix-events-socket-sub';

    try {
      let subscription;
      try {
        [subscription] = await this.pubsub
          .topic(topicName)
          .createSubscription(subscriptionName);
      } catch {
        subscription = this.pubsub.subscription(subscriptionName);
      }

      subscription.on('message', (message: any) => {
        try {
          const data = JSON.parse(message.data.toString());
          const eventType = data.type || 'PIX_EVENT';
          const payload = data;
          this.broadcastPixEvent({ type: eventType, payload });
          message.ack();
        } catch (e) {
          this.logger.error('Error parsing pix pubsub message', e);
          message.ack();
        }
      });

      subscription.on('error', (err: any) => {
        this.logger.error('Pix pubsub subscription error', err);
      });

      this.logger.log(`Subscribed to ${topicName} for socket fanout.`);
    } catch (e) {
      this.logger.warn(
        'Could not setup pubsub sub for pix (may need topic created or perms): ' +
          (e as Error).message,
      );
    }
  }

  /**
   * Broadcast a pix event to all connected clients (or filter by room/neuralId in prod).
   */
  broadcastPixEvent(event: { type: string; payload: any }) {
    this.server.emit('pix_event', event); // Generic event
    if (event.type === 'PIX_RECEIVED') {
      this.server.emit('PIX_RECEIVED', event.payload);
    }
    if (event.type === 'PIX_SENT') {
      this.server.emit('PIX_SENT', event.payload);
    }
    this.logger.log(`Broadcasted pix_event: ${event.type}`);
  }
}
