/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Mobile App - Card Screen (Migrated from ok-regenera)
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/mobile-app/src/screens/Cards/CardScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Modal, 
  Dimensions 
} from 'react-native';
import { 
  ArrowLeft, 
  Lock, 
  Eye, 
  Settings, 
  CreditCard, 
  ShoppingBag, 
  Unlock, 
  Plus, 
  AlertCircle, 
  EyeOff, 
  CheckCircle, 
  Star, 
  X, 
  Gift, 
  Plane, 
  Wine 
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// ✅ MIGRADO: Design System
import { GlassCard, GlassButton, BottomNav } from '@regenera/ui';

// ✅ MIGRADO: Core Services
import { formatCurrency } from '@regenera/core/services/formatters';

// ✅ Types
import { MainStackParamList } from '../../navigation/types';

type CardsNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Cards'>;
type TabOption = 'invoice' | 'config';

const { width } = Dimensions.get('window');

export const CardScreen: React.FC = () => {
  const navigation = useNavigation<CardsNavigationProp>();
  const [activeTab, setActiveTab] = useState<TabOption>('invoice');
  const [isLocked, setIsLocked] = useState(false);
  const [showCardPassword, setShowCardPassword] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [invoicePaid, setInvoicePaid] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);

  // MOCK DATA
  const cardPurchases = [
    { name: 'Netflix', date: '30 Out', value: 5590 },
    { name: 'Spotify', date: '28 Out', value: 2190 },
    { name: 'iFood', date: '27 Out', value: 8950 },
  ];

  const handlePayInvoice = () => {
    setIsPaying(true);
    // Simulate API call
    setTimeout(() => {
      setIsPaying(false);
      setInvoicePaid(true);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      
      {/* BENEFITS MODAL */}
      <Modal
         visible={showBenefits}
         transparent={true}
         animationType="slide"
         onRequestClose={() => setShowBenefits(false)}
      >
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <View style={styles.modalHeader}>
                  <View>
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Star size={20} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.modalTitle}>Benefícios Black</Text>
                     </View>
                     <Text style={styles.modalSubtitle}>Exclusivo para clientes Infinite</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowBenefits(false)} style={styles.closeButton}>
                     <X size={20} color="#FFF"/>
                  </TouchableOpacity>
               </View>

               <ScrollView style={{ maxHeight: '80%' }}>
                  <GlassCard style={[styles.benefitCard, { backgroundColor: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.2)' }]}>
                     <View style={[styles.benefitIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                        <Plane size={20} color="#F59E0B" />
                     </View>
                     <View style={{ flex: 1 }}>
                        <Text style={styles.benefitTitle}>Sala VIP LoungeKey</Text>
                        <Text style={styles.benefitDesc}>Acesso ilimitado e gratuito para titular e 2 acompanhantes em mais de 1000 aeroportos.</Text>
                     </View>
                  </GlassCard>

                  <GlassCard style={styles.benefitCard}>
                     <View style={styles.benefitIcon}>
                        <Gift size={20} color="#FFF" />
                     </View>
                     <View style={{ flex: 1 }}>
                        <Text style={styles.benefitTitle}>Regenera Rewards</Text>
                        <Text style={styles.benefitDesc}>2.5 pontos por Dólar gasto. Seus pontos nunca expiram.</Text>
                     </View>
                  </GlassCard>

                  <GlassCard style={styles.benefitCard}>
                     <View style={styles.benefitIcon}>
                        <Wine size={20} color="#FFF" />
                     </View>
                     <View style={{ flex: 1 }}>
                        <Text style={styles.benefitTitle}>Isenção de Rolha</Text>
                        <Text style={styles.benefitDesc}>Em mais de 200 restaurantes parceiros selecionados.</Text>
                     </View>
                  </GlassCard>

                  <GlassButton onPress={() => setShowBenefits(false)} style={{ marginTop: 24 }}>
                     <Text style={styles.buttonText}>Entendi</Text>
                  </GlassButton>
               </ScrollView>
            </View>
         </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meus Cartões</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
           <Plus size={24} color="#3A66FF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
         {/* Card Visual */}
         <View style={styles.cardVisualContainer}>
           <View style={[
              styles.cardVisual, 
              isLocked ? styles.cardLocked : styles.cardUnlocked
           ]}>
             
             {/* Background Effects */}
             <View style={styles.cardGlow1} />
             <View style={styles.cardGlow2} />
             
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <View style={styles.chip} />
               <Text style={styles.cardBrand}>VISA</Text>
             </View>
             
             <View style={{ marginVertical: 16 }}>
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                 <Text style={styles.cardNumber}>
                   {isLocked ? '•••• •••• •••• ••••' : '•••• •••• •••• 4521'}
                 </Text>
               </View>
             </View>
             
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
               <View>
                 <Text style={styles.cardLabel}>Titular</Text>
                 <Text style={styles.cardValue}>DON PAULO R LEÃO</Text>
               </View>
               <View style={{ alignItems: 'flex-end' }}>
                 {isLocked && <Lock size={20} color="#FFF" style={{ marginBottom: 8 }} />}
                 <Text style={styles.cardLabel}>Validade</Text>
                 <Text style={styles.cardValue}>12/28</Text>
               </View>
             </View>
           </View>
         </View>

         {/* Actions Grid */}
         <View style={styles.actionsGrid}>
           <TouchableOpacity 
             onPress={() => setIsLocked(!isLocked)} 
             style={[styles.actionButton, isLocked && styles.actionButtonLocked]}
           >
             {isLocked ? <Unlock size={22} color="#F87171" /> : <Lock size={22} color="#06B6D4" />}
             <Text style={[styles.actionText, isLocked && { color: '#F87171' }]}>
               {isLocked ? 'Desbloquear' : 'Bloquear'}
             </Text>
           </TouchableOpacity>
           
           <TouchableOpacity 
             onPress={() => setShowCardPassword(!showCardPassword)} 
             style={styles.actionButton}
           >
             {showCardPassword ? <EyeOff size={22} color="#FFF" /> : <Eye size={22} color="#06B6D4" />}
             <Text style={styles.actionText}>{showCardPassword ? '1234' : 'Senha'}</Text>
           </TouchableOpacity>
           
           <TouchableOpacity style={styles.actionButton}>
             <Settings size={22} color="#06B6D4" />
             <Text style={styles.actionText}>Ajustar</Text>
           </TouchableOpacity>
           
           <TouchableOpacity style={styles.actionButton}>
             <CreditCard size={22} color="#06B6D4" />
             <Text style={styles.actionText}>Virtual</Text>
           </TouchableOpacity>
         </View>

         {/* Tabs */}
         <View style={styles.tabContainer}>
           <View style={styles.tabBar}>
             {['invoice', 'config'].map((tab) => (
               <TouchableOpacity
                 key={tab}
                 onPress={() => setActiveTab(tab as TabOption)}
                 style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
               >
                 <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                   {tab === 'invoice' ? 'Fatura Atual' : 'Configurações'}
                 </Text>
               </TouchableOpacity>
             ))}
           </View>
         </View>

         {/* Content - Invoice */}
         {activeTab === 'invoice' && (
           <View style={styles.contentSection}>
             <GlassCard style={{ overflow: 'hidden' }}>
                <View style={styles.invoiceGlow} />
               <Text style={{ color: '#9CA3AF', fontSize: 14 }}>Fatura atual</Text>
               <Text style={[
                 styles.invoiceAmount, 
                 invoicePaid && { color: '#10B981' }
               ]}>
                 {invoicePaid ? formatCurrency(0) : formatCurrency(245080)}
               </Text>
               
               {!invoicePaid ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                     <View style={styles.dotPulse} />
                     <Text style={{ color: '#FB923C', fontSize: 12, fontWeight: '500' }}>Vence em 10/Nov</Text>
                  </View>
               ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                     <CheckCircle size={14} color="#10B981" />
                     <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '500' }}>Fatura Paga</Text>
                  </View>
               )}
               
               <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: invoicePaid ? '0%' : '75%' }]} />
               </View>
               <Text style={{ textAlign: 'right', color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>
                 Limite: {formatCurrency(350000)}
               </Text>

               <GlassButton 
                  style={{ marginTop: 24 }} 
                  onPress={handlePayInvoice} 
                  disabled={invoicePaid || isPaying}
               >
                  <Text style={styles.buttonText}>{invoicePaid ? "Fatura Paga" : isPaying ? "Pagando..." : "Pagar Fatura"}</Text>
               </GlassButton>
             </GlassCard>

             <View style={{ marginTop: 24 }}>
               <Text style={styles.sectionHeader}>Histórico Recente</Text>
               {cardPurchases.map((p, i) => (
                 <GlassCard key={i} style={styles.purchaseCard}>
                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                     <View style={styles.purchaseIcon}>
                        <ShoppingBag size={18} color="rgba(255,255,255,0.7)" />
                     </View>
                     <View>
                       <Text style={{ color: '#FFF', fontWeight: '500', fontSize: 14 }}>{p.name}</Text>
                       <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{p.date}</Text>
                     </View>
                   </View>
                   <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14 }}>{formatCurrency(p.value)}</Text>
                 </GlassCard>
               ))}
             </View>
           </View>
         )}

         {/* Content - Config */}
         {activeTab === 'config' && (
            <View style={styles.contentSection}>
               <TouchableOpacity>
                  <GlassCard style={styles.configCard}>
                     <Text style={styles.configText}>Ajustes Avançados</Text>
                     <View style={styles.configIcon}>
                       <Settings size={18} color="#3A66FF" />
                     </View>
                  </GlassCard>
               </TouchableOpacity>

               <TouchableOpacity onPress={() => setShowBenefits(true)}>
                  <GlassCard style={styles.configCard}>
                     <View>
                        <Text style={[styles.configText, { color: '#FFF' }]}>Gerenciar Benefícios</Text>
                        <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Regenera Black Infinite</Text>
                     </View>
                     <View style={[styles.configIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                        <Star size={18} color="#F59E0B" fill="#F59E0B" />
                     </View>
                  </GlassCard>
               </TouchableOpacity>

               <GlassCard style={[styles.configCard, { opacity: 0.8 }]}>
                  <Text style={styles.configText}>Compras Online</Text>
                  <View style={styles.toggleTrack}>
                    <View style={styles.toggleThumb} />
                  </View>
               </GlassCard>
               
               <GlassCard style={[styles.configCard, { opacity: 0.8 }]}>
                  <Text style={styles.configText}>Pagamento por Aproximação</Text>
                  <View style={styles.toggleTrack}>
                    <View style={styles.toggleThumb} />
                  </View>
               </GlassCard>

               <View style={styles.alertBox}>
                  <AlertCircle size={20} color="#FB923C" />
                  <Text style={styles.alertText}>
                    Acesse Ajustes Avançados para configurar o Aviso Viagem e evitar bloqueios no exterior.
                  </Text>
               </View>
            </View>
         )}
      </ScrollView>

      <BottomNav activeScreen="cards" />
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
    justifyContent: 'space-between',
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
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  addButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  // Card Visual
  cardVisualContainer: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  cardVisual: {
    width: '100%',
    aspectRatio: 1.586,
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardUnlocked: {
    backgroundColor: '#1a1f4d', // Gradient handling would be more complex in RN without LinearGradient lib, using fallback color for now or could implement if lib available. Assuming solid color + glows for standard RN.
  },
  cardLocked: {
    backgroundColor: '#1F2937',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
  },
  cardGlow1: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(58, 102, 255, 0.3)',
    // blurRadius: 50 // Blur not supported natively on Views in plain RN without libraries usually.
  },
  cardGlow2: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(6, 182, 212, 0.3)',
  },
  chip: {
    width: 48,
    height: 36,
    backgroundColor: '#FCD34D',
    borderRadius: 6,
    opacity: 0.8,
  },
  cardBrand: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 20,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  cardNumber: {
    color: '#FFF',
    fontSize: 20,
    letterSpacing: 2,
    fontWeight: '500',
    // fontFamily: 'Monospace' // Platform specific usually
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  cardValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 32,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  actionButtonLocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  // Tabs
  tabContainer: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#3A66FF',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFF',
  },
  // Content
  contentSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  invoiceGlow: {
    position: 'absolute',
    top: -40,
    right: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(58, 102, 255, 0.2)',
  },
  invoiceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  dotPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3A66FF',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  sectionHeader: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  purchaseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  purchaseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Config
  configCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  configText: {
    color: '#FFF',
    fontWeight: '500',
  },
  configIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(58, 102, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTrack: {
    width: 40,
    height: 24,
    backgroundColor: '#3A66FF',
    borderRadius: 12,
    padding: 2,
    alignItems: 'flex-end',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#FFF',
    borderRadius: 10,
  },
  alertBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  alertText: {
    color: '#FDBA74',
    fontSize: 12,
    flex: 1,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  },
  benefitCard: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  benefitDesc: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
});

/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
