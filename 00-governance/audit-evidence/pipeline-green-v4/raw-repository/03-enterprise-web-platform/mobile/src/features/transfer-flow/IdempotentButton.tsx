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
 * @meta Domain: Mobile / Transfer
 * @description Button preventing double submissions.
 */

import React, { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

export const IdempotentButton = ({ onPress, title }: { onPress: () => Promise<void>, title: string }) => {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onPress();
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} disabled={loading} style={{ backgroundColor: '#00D1FF', padding: 15 }}>
      {loading ? <ActivityIndicator color="white" /> : <Text>{title}</Text>}
    </TouchableOpacity>
  );
};
