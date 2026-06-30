
import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { ScanFace, UserCheck, ShieldAlert, Loader2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing
} from 'react-native-reanimated';

import { useStore } from '../../../store/useStore';
import { authApi } from '../../../services/api';
import { RootStackParamList } from '../../../app/navigation/types';

const { height } = Dimensions.get('window');
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { authenticate } = useStore();
  const [phase, setPhase] = useState<'scanning' | 'analyzing' | 'authorized' | 'denied'>('scanning');
  const [progress, setProgress] = useState(0);

  // Animations
  const scanLineY = useSharedValue(-20);
  const ringRotation = useSharedValue(0);

  useEffect(() => {
    scanLineY.value = withRepeat(
      withSequence(
        withTiming(height * 0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-20, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    ringRotation.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );

    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(iv);
          return 100;
        }
        return p + 2;
      });
    }, 50);

    return () => clearInterval(iv);
  }, [scanLineY, ringRotation]);

  useEffect(() => {
    if (progress >= 100 && phase === 'scanning') {
      executeNeuralLogin();
    }
  }, [progress, phase]);

  async function executeNeuralLogin() {
    setPhase('analyzing');
    
    try {
      // Em produção, aqui chamaríamos authApi.login() com credenciais biométricas/token
      // Simulando delay de processamento neural
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPhase('authorized');
      
      authenticate('NEURAL-JWT-TOKEN-SECURE-V4', {
        neuralId: 'RG-2098233287',
        name: 'Don Paulo Ricardo',
        tier: 'Enterprise',
        account: '00012345-6',
        agency: '0001'
      });

      setTimeout(() => {
        navigation.replace('Main');
      }, 1000);

    } catch (error) {
      setPhase('denied');
    }
  }

  const animatedScanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }]
  }));

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }]
  }));

  const isSuccess = phase === 'authorized';
  const isError = phase === 'denied';

  return (
    <View className="flex-1 bg-[#050810] items-center justify-center relative">
      <View className="absolute inset-0 bg-[#0891b2] opacity-5" />

      <Animated.View 
        className="absolute w-full h-1 bg-cyan-400 z-20" 
        style={[animatedScanLineStyle, { shadowColor: '#22d3ee', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 20, elevation: 10 }]} 
      />

      <View className="items-center z-30">
        <View className="w-72 h-72 items-center justify-center mb-12 relative">
          <Animated.View 
            className={`absolute inset-0 border-[2px] rounded-full ${isSuccess ? 'border-emerald-500 opacity-80' : 'border-cyan-500 opacity-30 border-t-cyan-400'}`}
            style={isSuccess ? {} : animatedRingStyle}
          />
          <View className={`absolute inset-4 border border-dashed rounded-full ${isSuccess ? 'border-emerald-500 opacity-40' : 'border-cyan-500 opacity-40'}`} />

          <View className="items-center justify-center">
            {isSuccess ? (
              <UserCheck size={120} color="#10b981" />
            ) : (
              <ScanFace size={120} color="rgba(34, 211, 238, 0.4)" />
            )}
          </View>

          <View className="absolute -bottom-8 bg-[#050810]/90 border px-6 py-3 rounded-full flex-row items-center" style={{ borderColor: isSuccess ? '#10b981' : isError ? '#ef4444' : 'rgba(34, 211, 238, 0.3)' }}>
            {phase === 'analyzing' && <Loader2 size={16} color="#22d3ee" className="mr-2" />}
            <Text className={`font-bold tracking-widest text-xs uppercase ${isSuccess ? 'text-emerald-400' : isError ? 'text-red-400' : 'text-cyan-400'}`}>
              {phase === 'scanning' && 'Escaneando Íris...'}
              {phase === 'analyzing' && 'Neural Syncing...'}
              {phase === 'authorized' && 'Acesso Autorizado'}
              {phase === 'denied' && 'Acesso Negado'}
            </Text>
          </View>
        </View>

        <View className="w-72 mt-8">
          <View className="flex-row justify-between mb-2">
            <Text className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Identity Node</Text>
            <Text className={`text-[10px] uppercase tracking-widest font-bold ${isSuccess ? 'text-emerald-500' : 'text-cyan-500'}`}>
              {isSuccess ? 'TRUSTED' : 'VERIFYING'}
            </Text>
          </View>
          
          <View className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
            <View 
              className={`h-full ${isSuccess ? 'bg-emerald-500' : 'bg-cyan-500'}`} 
              style={{ width: `${progress}%` }} 
            />
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-[10px] text-gray-600">PROTO-ID: RG-2098233287</Text>
            <Text className="text-[10px] text-gray-600">{Math.round(progress)}%</Text>
          </View>
        </View>
      </View>

      <View className="absolute bottom-10 items-center">
        <View className="flex-row items-center justify-center mb-2 opacity-30">
          <ShieldAlert size={12} color="#fff" />
          <Text className="text-[9px] text-white ml-2 uppercase tracking-widest font-bold">Encrypted End-to-End · GCP-RSA-4096</Text>
        </View>
        <Text className="text-[10px] text-gray-700 tracking-widest">REG-BANK-SYSTEM_v4.0.0-PRO</Text>
      </View>
    </View>
  );
}
