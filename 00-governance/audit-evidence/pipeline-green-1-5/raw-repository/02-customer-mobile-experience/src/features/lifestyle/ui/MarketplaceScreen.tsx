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

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import { useStore } from '../../../store/useStore';
import { api } from '../../../services/api';

export default function MarketplaceScreen({ navigation }: any) {
  const { updateBalance } = useStore();
  const products = [
    { id: 1, name: 'iPhone 16 Pro Max', price: 12999, points: 1300 },
    { id: 2, name: 'MacBook Pro M4', price: 24999, points: 2500 },
    { id: 3, name: 'AirPods Max', price: 5499, points: 550 },
    { id: 4, name: 'Apple Watch Ultra 2', price: 8999, points: 900 }
  ];

  const handleBuy = async (p: any) => {
    try {
      // await api.post('/lifestyle/marketplace/buy', { productId: p.id });
      updateBalance(-p.price);
      Alert.alert('Compra Aprovada', `Seus +${p.points} RevPoints foram creditados.`);
    } catch (e) {
      Alert.alert('Erro', 'Falha ao processar compra.');
    }
  };

  return (
    <ScrollView className="flex-1 bg-[#020617]">
      <View className="p-6 pt-16">
        <View className="flex-row items-center mb-8">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center mr-4">
            <Text className="text-white">←</Text>
          </TouchableOpacity>
          <Text className="text-sm font-bold text-white uppercase tracking-widest">Marketplace</Text>
        </View>

        <View className="flex-row flex-wrap justify-between">
          {products.map(p => (
            <View key={p.id} className="w-[48%] bg-white/5 border border-white/10 rounded-3xl p-4 mb-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
              <View className="w-full h-24 bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                <ShoppingBag size={32} color="#22d3ee" />
              </View>
              <Text className="font-bold text-sm text-white mb-1 leading-tight">{p.name}</Text>
              <Text className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-3">+{p.points} PTS</Text>
              <Text className="text-lg font-bold text-white mb-4">R$ {p.price.toLocaleString('pt-BR')}</Text>
              <TouchableOpacity onPress={() => handleBuy(p)} className="w-full py-3 bg-cyan-600 rounded-xl items-center shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                <Text className="text-white font-bold uppercase tracking-widest text-[10px]">Comprar</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
