
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useStore } from '../../../store/useStore';

export default function InvestmentsScreen({ navigation }: any) {
  const { updateBalance } = useStore();
  const [selected, setSelected] = useState<any>(null);
  const [livePrice, setLivePrice] = useState<number | null>(null);

  const stocks = [
    { symbol: 'PETR4', name: 'Petrobras PN', price: 28.45, change: 2.3 },
    { symbol: 'VALE3', name: 'Vale ON', price: 65.20, change: -0.8 },
    { symbol: 'ITUB4', name: 'Itaú Unibanco', price: 31.10, change: 1.2 },
    { symbol: 'BBDC4', name: 'Bradesco', price: 14.85, change: 0.5 },
    { symbol: 'MGLU3', name: 'Magazine Luiza', price: 8.92, change: 3.7 }
  ];

  // Simulated WebSocket for selected stock
  useEffect(() => {
    if (!selected) return;
    setLivePrice(selected.price);
    const iv = setInterval(() => {
      setLivePrice(p => Math.max(0.01, +(p! + (Math.random() - 0.5) * 0.3).toFixed(2)));
    }, 1500);
    return () => clearInterval(iv);
  }, [selected]);

  const handleBuy = () => {
    if (!livePrice || !selected) return;
    updateBalance(-livePrice * 100);
    setSelected(null);
    alert(`Ordem de 100x ${selected.symbol} executada com sucesso.`);
  };

  return (
    <ScrollView className="flex-1 bg-[#020617]">
      <View className="p-6 pt-16">
        <View className="flex-row items-center mb-8">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center mr-4">
            <Text className="text-white">←</Text>
          </TouchableOpacity>
          <Text className="text-sm font-bold text-white uppercase tracking-widest">Bolsa B3 · Live</Text>
        </View>

        {selected ? (
          <View className="bg-indigo-950/40 border border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
            <Text className="text-white/70 text-sm mb-1 font-bold">{selected.name}</Text>
            <Text className={`font-light text-5xl mb-2 ${livePrice! > selected.price ? 'text-emerald-400' : livePrice! < selected.price ? 'text-red-400' : 'text-white'}`}>
              R$ {(livePrice || selected.price).toFixed(2)}
            </Text>
            <Text className="text-[10px] text-gray-500 mb-8 uppercase tracking-widest font-bold">Atualização em tempo real via Pub/Sub</Text>
            
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setSelected(null)} className="flex-1 py-4 bg-white/5 rounded-xl items-center border border-white/10">
                <Text className="text-white font-bold uppercase tracking-widest">Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleBuy} className="flex-1 py-4 bg-emerald-600 rounded-xl items-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Text className="text-white font-bold uppercase tracking-widest">Comprar 100</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="space-y-3">
            {stocks.map(s => (
              <TouchableOpacity 
                key={s.symbol} 
                onPress={() => setSelected(s)} 
                className="w-full flex-row items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl mb-3"
              >
                <View>
                  <Text className="font-bold text-white text-lg">{s.symbol}</Text>
                  <Text className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{s.name}</Text>
                </View>
                <View className="items-end">
                  <Text className="font-bold text-white text-lg">R$ {s.price.toFixed(2)}</Text>
                  <Text className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${s.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {s.change >= 0 ? '+' : ''}{s.change}%
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
