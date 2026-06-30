/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Mobile App - Dashboard Screen (Migrated from ok-regenera)
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/mobile-app/src/screens/Dashboard/DashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { 
  Eye, EyeOff, Bell, Cuboid, ScanBarcode, CreditCard,
  Leaf, Store, Gamepad2, Bone, Sparkles, ChevronRight,
  Globe, TrendingUp, ShieldCheck, Aperture, Target
} from 'lucide-react-native';

// ✅ MIGRADO: Usar Design System centralizado
import { 
  GlassCard, 
  GlassButton, 
  BottomNav 
} from '@regenera/ui';

// ✅ MIGRADO: Usar serviços do core package
import { formatCurrency } from '@regenera/core/formatters';

// ✅ NOVO: Integração com backend real via React Query
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { MainStackParamList } from '../../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type DashboardNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Dashboard'>;

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNavigationProp>();
  const { user } = useAuth();
  
  const [showBalance, setShowBalance] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [greeting, setGreeting] = useState('');

  // ✅ NOVO: Buscar dados reais do backend
  const { data: balanceData, isLoading } = useQuery({
    queryKey: ['balance', user?.id],
    queryFn: async () => {
      // Substituir por chamada real à API
      const response = await fetch(`${process.env.API_URL}/accounts/balance`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      return response.json();
    },
    enabled: !!user
  });

  const { data: aiInsight } = useQuery({
    queryKey: ['ai-insight', user?.id],
    queryFn: async () => {
      const response = await fetch(`${process.env.API_URL}/ai/insights`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      return response.json();
    }
  });

  // Time-aware greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
  }, []);

  const bentoItems = [
    { 
      col: 2, 
      title: 'Regenera Lens', 
      subtitle: 'Wealth AR Vision', 
      icon: Cuboid, 
      color: '#3A66FF',
      action: () => navigation.navigate('ARView'),
      special: true
    },
    { 
      col: 1, 
      title: 'Área Pix', 
      subtitle: 'Instantâneo', 
      icon: ScanBarcode, 
      color: 'rgba(255,255,255,0.05)',
      action: () => navigation.navigate('Pix')
    },
    { 
      col: 1, 
      title: 'Cartões', 
      subtitle: 'Gestão', 
      icon: CreditCard, 
      color: 'rgba(255,255,255,0.05)',
      action: () => navigation.navigate('Cards')
    },
    { 
      col: 1, 
      title: 'Transferir', 
      subtitle: 'TED/DOC', 
      icon: TrendingUp, 
      color: 'rgba(255,255,255,0.05)',
      action: () => navigation.navigate('Transfer')
    }
  ];

  const ecosystemItems = [
    { title: 'Metas', route: 'Goals', icon: Target, color: '#FF3B30' },
    { title: 'Carbono', route: 'Carbon', icon: Leaf, color: '#10B981' },
    { title: 'Market', route: 'Marketplace', icon: Store, color: '#F59E0B' },
    { title: 'Kids', route: 'Kids', icon: Gamepad2, color: '#8B5CF6' },
    { title: 'Pets', route: 'Pets', icon: Bone, color: '#EC4899' }
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      
      {/* Dynamic Header */}
      <View 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          paddingTop: 48,
          paddingBottom: scrolled ? 8 : 16,
          paddingHorizontal: 24,
          backgroundColor: scrolled ? 'rgba(10,14,23,0.9)' : 'transparent',
          borderBottomWidth: scrolled ? 1 : 0,
          borderBottomColor: 'rgba(255,255,255,0.05)',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <TouchableOpacity 
          onPress={() => navigation.navigate('Profile')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#111',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>
              {user?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{greeting},</Text>
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>
              {user?.name?.split(' ')[0] || 'Usuário'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.navigate('Notifications')}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Bell size={18} color="#FFF" />
          {/* Notification Badge */}
          <View style={{
            position: 'absolute',
            top: 10,
            right: 12,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: '#FF3B30'
          }} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        style={{ flex: 1, paddingTop: 96 }}
        onScroll={(e) => {
          const offsetY = e.nativeEvent.contentOffset.y;
          setScrolled(offsetY > 20);
        }}
        scrollEventThrottle={16}
      >
        
        {/* Balance Section */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('Analysis')}
          style={{ paddingHorizontal: 24, marginBottom: 24 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ 
              color: '#9CA3AF', 
              fontSize: 10, 
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: 2
            }}>
              Patrimônio Global
            </Text>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
              {showBalance ? <Eye size={14} color="#9CA3AF" /> : <EyeOff size={14} color="#9CA3AF" />}
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={{ height: 60, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 }} />
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Text style={{ fontSize: 24, color: '#9CA3AF' }}>R$</Text>
                <Text style={{ 
                  fontSize: 48, 
                  fontWeight: 'bold', 
                  color: '#FFF',
                  letterSpacing: -2
                }}>
                  {showBalance ? formatCurrency(balanceData?.balance || 0).replace('R$ ', '') : '•••••••'}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: 'rgba(16,185,129,0.1)',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6
                }}>
                  <TrendingUp size={12} color="#10B981" />
                  <Text style={{ color: '#10B981', fontSize: 12, fontWeight: 'bold' }}>
                    +{balanceData?.monthlyGrowth || '12.5'}%
                  </Text>
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                  Rendimentos do mês
                </Text>
              </View>
            </>
          )}
        </TouchableOpacity>

        {/* AI Insight */}
        {aiInsight && (
          <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
            <GlassCard onPress={() => navigation.navigate('Chat')}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#3A66FF',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={20} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#00F0FF', fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>
                    RAPHA INSIGHT
                  </Text>
                  <Text style={{ color: '#FFF', fontSize: 14, lineHeight: 18 }}>
                    {aiInsight.message}
                  </Text>
                </View>
                <ChevronRight size={16} color="rgba(255,255,255,0.5)" />
              </View>
            </GlassCard>
          </View>
        )}

        {/* Bento Grid */}
        <View style={{ 
          paddingHorizontal: 24, 
          flexDirection: 'row', 
          flexWrap: 'wrap', 
          gap: 12,
          marginBottom: 32 
        }}>
          {bentoItems.map((item, i) => (
            <GlassCard
              key={i}
              onPress={item.action}
              style={{ 
                width: item.col === 2 ? '100%' : '48%',
                minHeight: 120,
                padding: 20
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <item.icon size={20} color="#FFF" />
                </View>
                {item.special && (
                  <View style={{
                    backgroundColor: '#00F0FF',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 12
                  }}>
                    <Text style={{ color: '#000', fontSize: 9, fontWeight: 'bold' }}>V3.0</Text>
                  </View>
                )}
              </View>
              <View style={{ marginTop: 'auto' }}>
                <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>{item.title}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{item.subtitle}</Text>
              </View>
            </GlassCard>
          ))}
        </View>

        {/* Ecosystem */}
        <View style={{ marginBottom: 40 }}>
          <View style={{ 
            paddingHorizontal: 24, 
            flexDirection: 'row', 
            justifyContent: 'space-between',
            marginBottom: 16 
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Globe size={14} color="#3A66FF" />
              <Text style={{ 
                color: '#FFF', 
                fontSize: 12, 
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: 2
              }}>
                Ecossistema
              </Text>
            </View>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
          >
            {ecosystemItems.map((eco, i) => (
              <TouchableOpacity 
                key={i}
                onPress={() => navigation.navigate(eco.route as any)}
                style={{ alignItems: 'center', gap: 12, width: 80 }}
              >
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  backgroundColor: '#111',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <eco.icon size={24} color={eco.color} />
                </View>
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>
                  {eco.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Security Footer */}
        <View style={{ alignItems: 'center', paddingBottom: 24, opacity: 0.4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={10} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: 10, letterSpacing: 2 }}>
              REGENERA SECURE CORE
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Regenera Lens FAB */}
      <TouchableOpacity
        onPress={() => navigation.navigate('ARView')}
        style={{
          position: 'absolute',
          bottom: 96,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#3A66FF',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#06B6D4',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 30,
          elevation: 8
        }}
      >
        <Aperture size={24} color="#FFF" />
      </TouchableOpacity>

      <BottomNav activeScreen="dashboard" />
    </View>
  );
};

/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
