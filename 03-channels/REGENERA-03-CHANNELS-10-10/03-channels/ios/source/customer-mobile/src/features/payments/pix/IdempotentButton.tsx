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
