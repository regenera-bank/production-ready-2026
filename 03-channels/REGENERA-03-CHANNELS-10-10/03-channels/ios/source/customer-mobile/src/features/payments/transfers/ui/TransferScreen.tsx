import React, { useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Building2, CreditCard, Hash } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { api } from '../../../../platform/http/api-client';

function createIdempotencyKey(): string {
  const randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  if (!randomUUID) {
    throw new Error('O runtime não oferece um gerador criptográfico de UUID.');
  }
  return randomUUID();
}

function parseAmountCents(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) return null;

  const [whole, fraction = ''] = normalized.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

export default function TransferScreen({ navigation }: any) {
  const [bank, setBank] = useState('');
  const [agency, setAgency] = useState('');
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [biometricApproved, setBiometricApproved] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const txIdRef = useRef<string | null>(null);

  const doBiometricStepUp = async (): Promise<boolean> => {
    try {
      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);

      // Operação financeira não degrada silenciosamente para um fator mais fraco.
      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Biometria obrigatória',
          'Cadastre uma biometria no dispositivo antes de movimentar dinheiro.',
        );
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirme sua identidade para autorizar a transferência',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar credencial do dispositivo',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        Alert.alert('Autorização negada', 'A transferência não foi iniciada.');
        return false;
      }

      setBiometricApproved(true);
      return true;
    } catch (error) {
      console.error('Falha no step-up biométrico', error);
      Alert.alert('Biometria indisponível', 'A transferência foi bloqueada.');
      return false;
    }
  };

  const handleTransfer = async () => {
    if (!bank || !agency || !account || !amount || isProcessing) return;

    const amountCents = parseAmountCents(amount);
    if (!amountCents) {
      Alert.alert('Valor inválido', 'Informe um valor positivo com no máximo dois centavos.');
      return;
    }

    setIsProcessing(true);

    try {
      if (!biometricApproved && !(await doBiometricStepUp())) return;

      txIdRef.current ??= createIdempotencyKey();
      const idempotencyKey = txIdRef.current;
      const destinationKey = `${bank.trim()}-${agency.trim()}-${account.trim()}`;

      const response = await api.post(
        '/v1/pix/transfer',
        {
          key: destinationKey,
          amountCents,
          description: 'Transferência bancária via Regenera Mobile',
          idempotencyKey,
        },
        {
          headers: { 'Idempotency-Key': idempotencyKey },
        },
      );

      Alert.alert(
        'Operação aceita',
        `Transferência ${idempotencyKey} recebida. A liquidação será confirmada pelo evento autoritativo.`,
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }],
      );

      if (response.status >= 200 && response.status < 300) {
        txIdRef.current = null;
        setBiometricApproved(false);
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message ?? error?.message;

      // Erro de negócio encerra a tentativa. Falha de rede preserva a mesma chave para replay seguro.
      if (status && status < 500) txIdRef.current = null;

      Alert.alert(
        status ? 'Transferência recusada' : 'Falha de comunicação',
        message || 'A operação não foi concluída.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-[#020617]">
      <View className="p-6 pt-16">
        <View className="flex-row items-center mb-8">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-white/5 items-center justify-center mr-4">
            <Text className="text-white">←</Text>
          </TouchableOpacity>
          <Text className="text-sm font-bold text-white uppercase tracking-widest">Transferência (TED/DOC)</Text>
        </View>

        <View className="bg-white/5 rounded-3xl p-6 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <View className="mb-6 relative justify-center">
            <View className="absolute left-4 z-10"><Building2 size={20} color="#6b7280" /></View>
            <TextInput 
              value={bank} 
              onChangeText={setBank} 
              placeholder="Código do Banco (Ex: 341)" 
              placeholderTextColor="#6b7280"
              className="w-full pl-12 pr-4 py-4 bg-[#0a0f1e] border border-white/10 rounded-xl text-white font-bold" 
            />
          </View>

          <View className="flex-row gap-4 mb-6">
            <View className="flex-1 relative justify-center">
              <View className="absolute left-4 z-10"><Hash size={20} color="#6b7280" /></View>
              <TextInput 
                value={agency} 
                onChangeText={setAgency} 
                placeholder="Agência" 
                placeholderTextColor="#6b7280"
                className="w-full pl-12 pr-4 py-4 bg-[#0a0f1e] border border-white/10 rounded-xl text-white font-bold" 
              />
            </View>
            <View className="flex-1 relative justify-center">
              <View className="absolute left-4 z-10"><CreditCard size={20} color="#6b7280" /></View>
              <TextInput 
                value={account} 
                onChangeText={setAccount} 
                placeholder="Conta" 
                placeholderTextColor="#6b7280"
                className="w-full pl-12 pr-4 py-4 bg-[#0a0f1e] border border-white/10 rounded-xl text-white font-bold" 
              />
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">Valor</Text>
            <TextInput 
              keyboardType="numeric"
              value={amount} 
              onChangeText={setAmount} 
              placeholder="0,00" 
              placeholderTextColor="#6b7280"
              className="w-full px-4 py-4 bg-[#0a0f1e] border border-white/10 rounded-xl text-white text-3xl font-light" 
            />
          </View>

          <TouchableOpacity 
            disabled={!bank || !agency || !account || !amount} 
            onPress={handleTransfer} 
            className={`w-full py-4 rounded-xl items-center ${bank && agency && account && amount ? 'bg-cyan-600' : 'bg-white/5'}`}
          >
            <Text className={`font-bold uppercase tracking-widest ${bank && agency && account && amount ? 'text-white' : 'text-gray-500'}`}>
              Confirmar Transferência
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
