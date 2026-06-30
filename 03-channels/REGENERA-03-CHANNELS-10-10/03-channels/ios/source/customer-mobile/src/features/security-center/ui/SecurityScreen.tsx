
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ShieldAlert, Laptop, Smartphone, Tablet } from 'lucide-react-native';
import { useStore } from '../../../store/useStore';

export default function SecurityScreen({ navigation }: any) {
  const { logout } = useStore();
  const devices = [
    { name: 'iPhone 16 Pro', type: 'smartphone', location: 'São Paulo · BR', last: 'Agora', current: true },
    { name: 'MacBook Pro M4', type: 'laptop', location: 'São Paulo · BR', last: '2h atrás', current: false },
    { name: 'iPad Pro', type: 'tablet', location: 'Rio de Janeiro · BR', last: '3 dias atrás', current: false }
  ];

  const emergency = () => {
    Alert.alert(
      'Bloqueio de Emergência',
      'Isso congelará sua conta, revogará todos os JWTs ativos e acionará a polícia bancária. Confirmar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Acionar Bloqueio', 
          style: 'destructive', 
          onPress: () => {
            Alert.alert('CONTA BLOQUEADA', 'Identity Toolkit revogou todos os tokens.');
            setTimeout(logout, 2000);
          }
        }
      ]
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'laptop': return <Laptop size={20} color="#9ca3af" />;
      case 'tablet': return <Tablet size={20} color="#9ca3af" />;
      default: return <Smartphone size={20} color="#9ca3af" />;
    }
  };

  return (
    <ScrollView className="flex-1 bg-[#020617]">
      <View className="p-6 pt-16">
        <View className="flex-row items-center mb-8">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center mr-4">
            <Text className="text-white">←</Text>
          </TouchableOpacity>
          <Text className="text-sm font-bold text-red-400 uppercase tracking-widest">Anti-Fraude</Text>
        </View>

        <TouchableOpacity 
          onPress={emergency} 
          className="w-full p-6 bg-red-950/50 border-2 border-red-500/50 rounded-3xl flex-row items-center justify-between mb-8 shadow-[0_0_30px_rgba(244,63,94,0.15)]"
        >
          <View className="flex-1 pr-4">
            <Text className="font-bold text-red-400 text-lg mb-1">Bloqueio de Emergência</Text>
            <Text className="text-xs text-red-200/80 leading-relaxed">
              Congela conta, revoga JWT e notifica o SOC via Firebase Cloud Messaging.
            </Text>
          </View>
          <ShieldAlert size={32} color="#f87171" className="animate-pulse" />
        </TouchableOpacity>

        <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
          Dispositivos Ativos (Audit Trail)
        </Text>

        <View className="space-y-3">
          {devices.map((d, i) => (
            <View key={i} className="flex-row items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl mb-3">
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center">
                  {getIcon(d.type)}
                </View>
                <View>
                  <View className="flex-row items-center">
                    <Text className="font-bold text-sm text-white mr-2">{d.name}</Text>
                    {d.current && (
                      <View className="bg-emerald-500/20 px-2 py-0.5 rounded-full">
                        <Text className="text-[8px] text-emerald-400 uppercase tracking-wider font-bold">Atual</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{d.location} · {d.last}</Text>
                </View>
              </View>
              {!d.current && (
                <TouchableOpacity>
                  <Text className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Revogar</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
