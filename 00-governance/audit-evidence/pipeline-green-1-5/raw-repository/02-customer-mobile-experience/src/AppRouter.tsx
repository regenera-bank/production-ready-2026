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

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useStore } from './store/useStore';
import { colors } from './theme';
import { RootStackParamList, MainTabParamList } from './navigation/types';

// Auth screens
import KycScreen from './features/identity/ui/KycScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

// Tab screens
import HomeScreen from './screens/HomeScreen';
import ExtratoScreen from './screens/ExtratoScreen';
import CardsScreen from './screens/CardsScreen';

// Stack (detail) screens
import PixScreen from './screens/PixScreen';
import NeuralCoreScreen from './screens/NeuralCoreScreen';
import ProfileScreen from './features/banking/ui/ProfileScreen';
import NotificationsScreen from './features/banking/ui/NotificationsScreen';
import OpenFinanceScreen from './features/openbanking/ui/OpenFinanceScreen';
import InvestmentsScreen from './features/investments/ui/InvestmentsScreen';
import MarketplaceScreen from './features/lifestyle/ui/MarketplaceScreen';
import SecurityScreen from './features/compliance/ui/SecurityScreen';
import TaxScreen from './features/banking/ui/TaxScreen';
import TransferScreen from './features/transfer/ui/TransferScreen';
import KidsScreen from './screens/KidsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Ícone customizado central "R"
function CentralRButton({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={s.centralBtn}>
      <Text style={s.centralBtnText}>R</Text>
    </TouchableOpacity>
  );
}

// Navegador de Abas
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0e1a',
          borderTopColor: 'rgba(255,255,255,0.1)',
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
          paddingTop: 4,
          position: 'absolute', // Permite que o botão central se sobreponha
          bottom: 0,
        },
        tabBarActiveTintColor: colors.cyan,
        tabBarInactiveTintColor: '#6b7280',
        tabBarShowLabel: false, // Esconde as labels laterais
      }}
    >
      <Tab.Screen
        name="Extrato"
        component={ExtratoScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20, fontWeight: '700' }}>E</Text>,
        }}
      />
      
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: () => null,
          tabBarButton: (props) => <CentralRButton onPress={props.onPress as any} />,
        }}
      />
      
      <Tab.Screen
        name="Cartoes"
        component={CardsScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20, fontWeight: '700' }}>C</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppRouter() {
  const { isAuthenticated } = useStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Kyc" component={KycScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            {/* O Navigator de Tabs encapsula a navegação base */}
            <Stack.Screen name="Main" component={MainTabs} />
            
            {/* Telas de detalhe sobrepõem as Tabs */}
            <Stack.Screen name="Pix" component={PixScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Transfer" component={TransferScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="NeuralCore" component={NeuralCoreScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Investments" component={InvestmentsScreen} />
            <Stack.Screen name="OpenFinance" component={OpenFinanceScreen} />
            <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
            <Stack.Screen name="Security" component={SecurityScreen} />
            <Stack.Screen name="Tax" component={TaxScreen} />
            <Stack.Screen name="Kids" component={KidsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const s = StyleSheet.create({
  centralBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    // Cores fiéis ao pedido (cyan -> blue será simulado em React Native sem SVG/LinearGradient nativo)
    backgroundColor: '#00c8e0', 
    alignItems: 'center',
    justifyContent: 'center',
    top: -20, // Elevado -20px
    borderWidth: 4,
    borderColor: '#080d1a',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
    // Permite que o botão se alinhe ao centro usando flex no container do tab bar
    alignSelf: 'center',
  },
  centralBtnText: { 
    color: '#fff', 
    fontWeight: '900', 
    fontSize: 24, 
    fontStyle: 'italic' 
  },
});
