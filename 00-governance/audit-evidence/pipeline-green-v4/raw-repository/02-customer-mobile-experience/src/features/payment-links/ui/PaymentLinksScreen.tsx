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

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Clipboard } from 'react-native';
import { Link, Copy, CheckCircle2 } from 'lucide-react-native';
import { createPaymentLink } from '../api/paymentLinksApi';

export default function PaymentLinksScreen({ navigation }: any) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkData, setLinkData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const value = parseFloat(amount.replace(',', '.'));
      if (isNaN(value) || value <= 0) {
        throw new Error('Valor inválido');
      }

      // Simulate API call to backend wrapper
      setTimeout(() => {
        setLinkData({
          id: `plnk_${Math.random().toString(36).substr(2, 9)}`,
          url: `https://pay.regenerabank.app/checkout/${Math.random().toString(36).substr(2, 9)}`,
          status: 'ACTIVE',
          amount: value,
        });
        setLoading(false);
      }, 1500);

    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao gerar link');
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (linkData?.url) {
      // Use Clipboard from react-native (deprecated but works for simulation)
      // In production, use expo-clipboard
      Clipboard.setString(linkData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <ScrollView className="flex-1 bg-[#020617]">
      <View className="p-6 pt-16">
        <View className="flex-row items-center mb-8">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center mr-4">
            <Text className="text-white">←</Text>
          </TouchableOpacity>
          <Text className="text-sm font-bold text-white uppercase tracking-widest">Links de Pagamento</Text>
        </View>

        <View className="bg-white/5 rounded-3xl p-6 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <View className="flex-row items-center gap-3 mb-8 border-b border-white/10 pb-4">
            <View className="w-12 h-12 rounded-full bg-blue-500/20 items-center justify-center">
              <Link size={24} color="#60a5fa" />
            </View>
            <View>
              <Text className="text-white font-bold uppercase tracking-widest text-sm">Gerar Cobrança</Text>
              <Text className="text-[10px] text-gray-500 uppercase mt-1">Integração Direta Gateway</Text>
            </View>
          </View>

          {!linkData ? (
            <View>
              <View className="mb-6">
                <Text className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Valor</Text>
                <TextInput
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0,00"
                  placeholderTextColor="#475569"
                  className="w-full px-4 py-4 bg-[#0a0f1e] border border-white/10 rounded-xl text-white text-3xl font-light"
                />
              </View>

              <View className="mb-8">
                <Text className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Descrição (Opcional)</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Ex: Consultoria Financeira"
                  placeholderTextColor="#475569"
                  className="w-full px-4 py-4 bg-[#0a0f1e] border border-white/10 rounded-xl text-white font-bold"
                />
              </View>

              <TouchableOpacity 
                onPress={handleGenerate}
                disabled={loading || !amount}
                className={`w-full py-4 rounded-xl items-center flex-row justify-center ${loading || !amount ? 'bg-blue-900/50' : 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]'}`}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-bold uppercase tracking-widest">Criar Link</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View className="animate-fade-in-up">
              <View className="p-5 bg-white/5 border border-white/10 rounded-2xl mb-6">
                <Text className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 font-bold">Link Gerado com Sucesso</Text>
                <Text className="font-light text-3xl text-white mb-6">R$ {linkData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                
                <View className="flex-row items-center gap-2">
                  <TextInput 
                    value={linkData.url}
                    editable={false}
                    className="flex-1 px-4 py-3 bg-[#020617] border border-white/5 rounded-xl text-xs text-gray-400 font-mono"
                  />
                  <TouchableOpacity onPress={copyToClipboard} className="w-12 h-12 bg-white/10 rounded-xl items-center justify-center">
                    {copied ? <CheckCircle2 size={20} color="#10b981" /> : <Copy size={20} color="#ffffff" />}
                  </TouchableOpacity>
                </View>
              </View>
              
              <TouchableOpacity onPress={() => { setLinkData(null); setAmount(''); setDescription(''); }} className="w-full py-4 bg-white/5 border border-white/10 rounded-xl items-center">
                <Text className="text-gray-300 font-bold uppercase tracking-widest">Nova Cobrança</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
