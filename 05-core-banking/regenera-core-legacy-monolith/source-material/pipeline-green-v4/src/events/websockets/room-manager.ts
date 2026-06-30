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

import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class RoomManager {
  private readonly logger = new Logger(RoomManager.name);

  assignToUserRoom(client: Socket, userId: string) {
    const roomName = `user:${userId}`;
    client.join(roomName);
    this.logger.debug(`Socket ${client.id} joined isolated room ${roomName}`);
  }

  leaveUserRoom(client: Socket, userId: string) {
    client.leave(`user:${userId}`);
  }
}
