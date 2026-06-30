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

/**
 * @meta Domain: Mobile / Camera
 * @description Liveness detection camera component.
 */

import React, { useRef } from 'react';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { FaceMask } from './face-mask';

export const LivenessCapture = () => {
  const devices = useCameraDevices();
  const device = devices.front;

  if (device == null) return null;

  return (
    <>
      <Camera
        style={{ flex: 1 }}
        device={device}
        isActive={true}
        frameProcessorFps={5}
      />
      <FaceMask />
    </>
  );
};
