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
