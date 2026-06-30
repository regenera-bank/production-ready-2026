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

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { RoomManager } from './room-manager';
import { SocketAuthMiddleware } from './socket-auth.middleware';

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket'],
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(SocketGateway.name);

  constructor(private roomManager: RoomManager) {}

  afterInit(server: Server) {
    server.use(SocketAuthMiddleware() as any);
    this.logger.log('Socket.io Gateway Initialized with Auth Middleware');
  }

  handleConnection(client: Socket) {
    const userId = client.data.user?.uid;
    if (userId) {
      this.roomManager.assignToUserRoom(client, userId);
      this.logger.log(`User ${userId} connected via socket ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitToUser(userId: string, event: string, payload: any) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }
}
