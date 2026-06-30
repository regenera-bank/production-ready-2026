/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Mobile App - Notifications Screen (Migrated from ok-regenera)
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/mobile-app/src/screens/Notifications/NotificationsScreen.tsx
import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView 
} from 'react-native';
import { ArrowLeft, Bell, Calendar, Percent, ShieldAlert } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// ✅ MIGRADO: Design System
import { GlassCard, BottomNav } from '@regenera/ui';

// ✅ Types
import { MainStackParamList } from '../../navigation/types';

type NotificationsNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Notifications'>;

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NotificationsNavigationProp>();

  const notifications = [
    { 
       id: 1, 
       type: 'alert', 
       title: 'Tentativa de Login Bloqueada', 
       desc: 'Identificamos um acesso suspeito em São Paulo. Se não foi você, altere sua senha imediatamente.',
       time: '2 min atrás',
       icon: ShieldAlert,
       color: '#F87171',
       bg: 'rgba(239, 68, 68, 0.2)'
    },
    { 
       id: 2, 
       type: 'promo', 
       title: 'Cashback Recebido', 
       desc: 'Você recebeu R$ 12,50 de cashback na sua compra na Amazon.',
       time: '2 horas atrás',
       icon: Percent,
       color: '#10B981',
       bg: 'rgba(16, 185, 129, 0.2)'
    },
    { 
       id: 3, 
       type: 'info', 
       title: 'Fatura Fechada', 
       desc: 'Sua fatura de Maio fechou no valor de R$ 2.450,80. O vencimento é dia 10.',
       time: 'Ontem',
       icon: Calendar,
       color: '#3A66FF',
       bg: 'rgba(58, 102, 255, 0.2)'
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {notifications.map((notif) => (
           <GlassCard key={notif.id} style={styles.notifCard}>
              <View style={[styles.iconBox, { backgroundColor: notif.bg }]}>
                 <notif.icon size={22} color={notif.color} />
              </View>
              <View style={{ flex: 1 }}>
                 <View style={styles.notifHeader}>
                    <Text style={styles.notifTitle}>{notif.title}</Text>
                    <Text style={styles.notifTime}>{notif.time}</Text>
                 </View>
                 <Text style={styles.notifDesc}>{notif.desc}</Text>
              </View>
           </GlassCard>
        ))}

        <View style={styles.emptyState}>
           <Bell size={32} color="rgba(255,255,255,0.1)" />
           <Text style={styles.emptyText}>Isso é tudo por enquanto.</Text>
        </View>
      </ScrollView>

      <BottomNav activeScreen="notifications" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(10,14,23,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100,
    gap: 16,
  },
  notifCard: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: 'rgba(255,255,255,0.1)',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notifTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  notifTime: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  notifDesc: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
});

/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
