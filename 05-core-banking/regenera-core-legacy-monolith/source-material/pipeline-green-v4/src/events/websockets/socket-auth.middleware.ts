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

import { Socket } from 'socket.io';
import * as admin from 'firebase-admin';

export const SocketAuthMiddleware = () => {
  return async (socket: Socket, next: (err?: Error) => void) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers['authorization'];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const idToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      socket.data.user = decodedToken;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  };
};
