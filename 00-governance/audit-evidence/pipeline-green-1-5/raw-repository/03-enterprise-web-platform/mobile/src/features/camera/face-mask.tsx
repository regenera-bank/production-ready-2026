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
 * @description SVG overlay for face alignment.
 */

import React from 'react';
import Svg, { Ellipse, Mask, Rect, Defs } from 'react-native-svg';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const FaceMask = () => (
  <Svg height={height} width={width} style={{ position: 'absolute' }}>
    <Defs>
      <Mask id="mask">
        <Rect height="100%" width="100%" fill="white" />
        <Ellipse cx="50%" cy="40%" rx="120" ry="160" fill="black" />
      </Mask>
    </Defs>
    <Rect height="100%" width="100%" fill="rgba(0,0,0,0.7)" mask="url(#mask)" />
  </Svg>
);
