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

import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import { NativeAuthService } from '../biometrics/native-auth.service';
import { apiClient } from '../../../../frontend/src/shared/api/client';

export const PixScreen = () => {
  const idempotencyKey = useRef(crypto.randomUUID());
  const [key, setKey] = useState('');
  const [amount, setAmount] = useState('');

  const sendPix = async () => {
    const amountCents = Math.round(parseFloat(amount.replace(',','.')) * 100);
    const auth = await NativeAuthService.authenticate('Confirme para enviar o PIX');
    if (!auth) return;

    try {
      await apiClient.post('/pix/transfer', { destinationKey: key, amountCents }, {
        headers: { 'Idempotency-Key': idempotencyKey.current }
      });
      Alert.alert('Sucesso', 'PIX enviado.');
      idempotencyKey.current = crypto.randomUUID();
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message || 'Falha de rede.');
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#080d1a' }}>
      <TextInput placeholder="Chave PIX" value={key} onChangeText={setKey} style={{ backgroundColor: '#0d1526', padding: 15, color: '#fff', marginBottom: 15 }} />
      <TextInput placeholder="Valor" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={{ backgroundColor: '#0d1526', padding: 15, color: '#fff', marginBottom: 15 }} />
      <TouchableOpacity onPress={sendPix} style={{ backgroundColor: '#6366f1', padding: 15, alignItems: 'center' }}>
        <Text style={{ color: '#fff' }}>Transferir</Text>
      </TouchableOpacity>
    </View>
  );
};
