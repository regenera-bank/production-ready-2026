
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FileText, Download, Loader2 } from 'lucide-react-native';
import { api } from '../../../services/api';

export default function TaxScreen({ navigation }: any) {
  const [generating, setGenerating] = useState(false);

  const generateDARF = async () => {
    setGenerating(true);
    try {
      // Simulate BigQuery processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('DARF Gerado. URL assinada do Cloud Storage expira em 5min.');
    } catch (e) {
      alert('Falha ao compilar impostos.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-[#020617]">
      <View className="p-6 pt-16">
        <View className="flex-row items-center mb-8">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center mr-4">
            <Text className="text-white">←</Text>
          </TouchableOpacity>
          <Text className="text-sm font-bold text-white uppercase tracking-widest">Impostos · BigQuery</Text>
        </View>

        <View className="bg-yellow-950/40 border border-yellow-500/30 rounded-3xl p-6 mb-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <Text className="text-[10px] uppercase tracking-widest text-yellow-400 mb-2 font-bold">Imposto Estimado 2026</Text>
          <Text className="text-4xl font-light text-white">R$ 12.450,32</Text>
          <Text className="text-[10px] text-gray-500 mt-3 font-mono">Calculado sobre rendimentos no BigQuery</Text>
        </View>

        <TouchableOpacity 
          onPress={generateDARF} 
          disabled={generating} 
          className="w-full py-4 bg-cyan-600 rounded-xl items-center mb-8 flex-row justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)]"
        >
          {generating ? (
            <>
              <ActivityIndicator color="#ffffff" className="mr-2" />
              <Text className="text-white font-bold uppercase tracking-widest text-[10px]">Compilando Dados...</Text>
            </>
          ) : (
            <Text className="text-white font-bold uppercase tracking-widest text-sm">Gerar DARF (PDF)</Text>
          )}
        </TouchableOpacity>

        <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Documentos · Cloud Storage</Text>
        <View className="space-y-3">
          {['Extrato Anual 2025', 'Informe de Rendimentos 2025', 'Comprovante Residência'].map((d, i) => (
            <View key={i} className="flex-row items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl mb-3">
              <View className="flex-row items-center gap-3">
                <FileText size={20} color="#22d3ee" />
                <Text className="text-sm text-white font-bold ml-3">{d}</Text>
              </View>
              <TouchableOpacity>
                <Download size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
