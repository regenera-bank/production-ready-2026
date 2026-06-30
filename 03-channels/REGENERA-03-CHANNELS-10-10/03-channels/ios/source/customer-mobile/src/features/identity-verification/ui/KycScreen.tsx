
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { ShieldCheck, User, ArrowRight } from 'lucide-react-native';
import { validateCpfIdentity } from '../api/kycApi';
import { CpfValidationSchema, CpfBasicData } from '../model/kyc';

export default function KycScreen({ navigation }: any) {
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [identity, setIdentity] = useState<CpfBasicData | null>(null);

  const handleVerifyIdentity = async () => {
    Keyboard.dismiss();
    try {
      setLoading(true);
      setIdentity(null);

      // Limpeza do input: removemos pontos e traços para enviar apenas números
      const cleanCpf = cpf.replace(/\D/g, '');

      // Zod garante que o formato esteja correto antes de chamar a API
      const validPayload = CpfValidationSchema.parse({ document_number: cleanCpf });

      // O motor invisível valida o CPF
      const result = await validateCpfIdentity(validPayload);
      setIdentity(result);

    } catch (error: any) {
      if (error.errors) {
        Alert.alert('Formato Inválido', error.errors[0].message);
      } else {
        Alert.alert('Verificação de Segurança', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#020617] p-6 justify-center">
      <View className="mb-10 items-center">
        <View className="w-16 h-16 bg-cyan-500 rounded-2xl items-center justify-center mb-4 transform rotate-12 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
          <View className="w-8 h-8 bg-[#020617] rounded-full transform -rotate-12" />
        </View>
        <Text className="text-white text-3xl font-bold tracking-tight">Regenera Bank</Text>
        <Text className="text-cyan-400 text-sm font-semibold tracking-widest uppercase mt-2">
          Validação de Identidade (KYC)
        </Text>
      </View>

      <View className="bg-white/5 rounded-3xl p-6 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
        <Text className="text-gray-400 text-xs font-bold uppercase mb-4 tracking-widest">
          Digite seu CPF
        </Text>

        <View className="flex-row items-center border-b border-white/10 pb-2 mb-8">
          <User color="#475569" size={20} className="mr-3" />
          <TextInput
            className="flex-1 text-white text-2xl font-bold tracking-widest"
            placeholder="000.000.000-00"
            placeholderTextColor="#1e293b"
            keyboardType="number-pad"
            maxLength={14}
            value={cpf}
            onChangeText={setCpf}
          />
        </View>

        {!identity ? (
          <TouchableOpacity 
            onPress={handleVerifyIdentity}
            disabled={loading}
            className={`flex-row items-center justify-center p-4 rounded-2xl ${loading ? 'bg-cyan-900' : 'bg-cyan-500'} shadow-[0_0_20px_rgba(6,182,212,0.3)]`}
          >
            {loading ? (
              <ActivityIndicator color="#020617" />
            ) : (
              <Text className="text-[#020617] font-black text-lg uppercase tracking-wider">Acessar Sistema</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View>
            <View className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl mb-4 flex-row items-center">
              <ShieldCheck color="#10b981" size={24} className="mr-3" />
              <View className="flex-1">
                <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                  Identidade Confirmada
                </Text>
                <Text className="text-white font-bold text-lg mt-1" numberOfLines={1}>
                  {identity.Name}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
               onPress={() => navigation.navigate('Login')}
               className="flex-row items-center justify-center p-4 rounded-2xl bg-white/10 border border-white/20"
            >
              <Text className="text-white font-bold text-sm mr-2 uppercase tracking-widest">Avançar para Login Neural</Text>
              <ArrowRight color="#fff" size={16} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
