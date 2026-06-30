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

import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  ActivityIndicator, KeyboardAvoidingView, 
  Platform, Alert 
} from 'react-native';
import { UserPlus, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { authApi } from '../services/api';
import { useStore } from '../store/useStore';
import { colors } from '../theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RegisterScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { authenticate } = useStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || password.length < 8) {
      Alert.alert('Dados Inválidos', 'Preencha todos os campos e certifique-se que a senha tem 8 ou mais caracteres.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.register(name, email, password);
      // Backend retorna { accessToken, user }
      const { accessToken, user } = response.data;
      
      authenticate(accessToken, user);
      // Navegação para a Home ocorre automaticamente devido ao RootStack (isAuthenticated)
    } catch (error: any) {
      Alert.alert(
        'Falha no Cadastro', 
        error.message || 'Houve um erro na comunicação com o servidor neural.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 px-6 justify-center">
        {/* Header Title */}
        <View className="items-center mb-10">
          <View className="w-16 h-16 bg-cyan-500/10 rounded-full border border-cyan-500/30 items-center justify-center mb-4">
            <UserPlus color={colors.cyan} size={32} />
          </View>
          <Text className="text-white text-2xl font-bold tracking-widest uppercase">Criar Conta</Text>
          <Text className="text-cyan-400 text-[10px] font-bold tracking-[0.2em] mt-1">Regenera Neural Node</Text>
        </View>

        {/* Formulário */}
        <View className="space-y-4 mb-8">
          <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-1 h-14">
            <UserPlus color={colors.cyanDim} size={20} className="mr-3" />
            <TextInput
              className="flex-1 text-white text-sm"
              placeholder="Nome Completo"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-1 h-14">
            <Mail color={colors.cyanDim} size={20} className="mr-3" />
            <TextInput
              className="flex-1 text-white text-sm"
              placeholder="Endereço de E-mail"
              placeholderTextColor="#64748b"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-1 h-14">
            <Lock color={colors.cyanDim} size={20} className="mr-3" />
            <TextInput
              className="flex-1 text-white text-sm"
              placeholder="Senha de Acesso"
              placeholderTextColor="#64748b"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              {showPass ? (
                <EyeOff color="#64748b" size={20} />
              ) : (
                <Eye color="#64748b" size={20} />
              )}
            </TouchableOpacity>
          </View>
          <Text className="text-[10px] text-gray-500 ml-2">Mínimo de 8 caracteres alfanuméricos</Text>
        </View>

        <TouchableOpacity 
          onPress={handleRegister}
          disabled={loading}
          className={`flex-row items-center justify-center p-4 rounded-2xl ${loading ? 'bg-cyan-900' : 'bg-cyan-500'}`}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <>
              <ShieldCheck color={colors.background} size={20} className="mr-2" />
              <Text className="text-[#020617] font-bold text-sm uppercase tracking-widest">
                Registrar no Sistema
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.navigate('Login')}
          className="mt-6 items-center p-4"
        >
          <Text className="text-gray-400 text-xs">
            Já possui acesso Neural? <Text className="text-cyan-400 underline">Fazer Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
