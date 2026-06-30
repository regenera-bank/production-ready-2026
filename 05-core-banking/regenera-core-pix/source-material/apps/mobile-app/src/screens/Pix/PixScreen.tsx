/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Mobile App - Pix Screen (Migrated from ok-regenera)
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/mobile-app/src/screens/Pix/PixScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Animated, 
  Dimensions, 
  Alert
} from 'react-native';
import { 
  ArrowLeft, 
  FileText, 
  QrCode, 
  Copy, 
  Share2, 
  CheckCircle, 
  ChevronRight, 
  User, 
  Building2, 
  ScanLine, 
  ShieldAlert, 
  ShieldCheck, 
  BrainCircuit, 
  Lock 
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// ✅ MIGRADO: Design System
import { GlassCard, GlassButton, BottomNav } from '@regenera/ui';

// ✅ MIGRADO: Core Services
import { formatCurrency } from '@regenera/core/services/formatters';
import { analyzeTransactionRisk, FraudAnalysisResult } from '@regenera/core/services/fraudDetection';

// ✅ Types
import { MainStackParamList } from '../../navigation/types';

type PixNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Pix'>;

type PixMode = 'hub' | 'scan' | 'receive' | 'transfer' | 'amount' | 'confirm' | 'success';

const { width } = Dimensions.get('window');

export const PixScreen: React.FC = () => {
  const navigation = useNavigation<PixNavigationProp>();
  const [mode, setMode] = useState<PixMode>('hub');
  const [amount, setAmount] = useState('0');
  const [analysisState, setAnalysisState] = useState<'idle' | 'scanning' | 'flagged'>('idle');
  const [fraudResult, setFraudResult] = useState<FraudAnalysisResult | null>(null);
  
  // Animation for scanner
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (mode === 'scan') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          })
        ])
      ).start();
    }
  }, [mode]);

  const handleAmountInput = (value: string) => {
    let newAmount = amount;
    if (value === 'backspace') {
      newAmount = newAmount.slice(0, -1);
    } else {
      if (newAmount.length < 10) newAmount += value;
    }
    setAmount(newAmount || '0');
  };

  const getFormattedAmount = () => {
    const numericValue = parseInt(amount, 10);
    return isNaN(numericValue) ? 'R$ 0,00' : formatCurrency(numericValue);
  };

  const initiateTransfer = async () => {
    const value = parseInt(amount, 10);
    if (value === 0) return;

    // Simulate 2FA check (Mock for now as Modal component is pending migration)
    if (value > 100000) { // Example limit
       Alert.alert("Autenticação Necessária", "Valor alto requer validação biométrica.");
       // In production, this would trigger the Biometric Prompt
    }
    
    await performRiskAnalysis();
  };

  const performRiskAnalysis = async () => {
    setAnalysisState('scanning');
    
    // ML Analysis Simulation
    // In a real scenario, this would await an API call
    try {
      const result = await analyzeTransactionRisk(parseInt(amount), 'João Silva');
      setFraudResult(result);

      if (result.riskLevel === 'SAFE') {
        setTimeout(() => {
           setAnalysisState('idle');
           setMode('success');
        }, 1500); // Artificial delay for UX
      } else {
        setAnalysisState('flagged');
      }
    } catch (e) {
      setAnalysisState('idle');
      Alert.alert("Erro", "Falha na análise de risco.");
    }
  };

  // ─── RENDERS ────────────────────────────────────────────────────────────────

  // 1. HUB (Menu Principal)
  if (mode === 'hub') {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
             <ArrowLeft size={24} color="#FFF" />
           </TouchableOpacity>
           <Text style={styles.headerTitle}>Área Pix</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
           <View style={styles.grid}>
              <GlassButton onPress={() => setMode('scan')} style={[styles.gridButton, { backgroundColor: 'rgba(58, 102, 255, 0.1)' }]}>
                 <ScanLine size={32} color="#06B6D4" />
                 <Text style={styles.gridButtonText}>Ler QR Code</Text>
              </GlassButton>
              <GlassButton onPress={() => setMode('transfer')} style={styles.gridButton}>
                 <User size={32} color="#FFF" />
                 <Text style={styles.gridButtonText}>Transferir</Text>
              </GlassButton>
              <GlassButton onPress={() => setMode('receive')} style={styles.gridButton}>
                 <QrCode size={32} color="#FFF" />
                 <Text style={styles.gridButtonText}>Receber</Text>
              </GlassButton>
              <GlassButton onPress={() => setMode('transfer')} style={styles.gridButton}>
                 <FileText size={32} color="#FFF" />
                 <Text style={styles.gridButtonText}>Pix Copia e Cola</Text>
              </GlassButton>
           </View>

           <GlassCard style={{ marginTop: 24 }}>
              <Text style={styles.sectionTitle}>FAVORITOS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favoritesScroll}>
                 {['Mãe', 'Amor', 'João', 'Netflix'].map((name, i) => (
                    <TouchableOpacity key={i} onPress={() => setMode('amount')} style={styles.favoriteItem}>
                       <View style={styles.favoriteAvatar}>
                          <Text style={styles.favoriteInitials}>{name.charAt(0)}</Text>
                       </View>
                       <Text style={styles.favoriteName}>{name}</Text>
                    </TouchableOpacity>
                 ))}
              </ScrollView>
           </GlassCard>
        </ScrollView>
        <BottomNav activeScreen="pix" />
      </View>
    );
  }

  // 2. SCANNER
  if (mode === 'scan') {
    return (
      <View style={styles.containerBlack}>
          {/* Simulated Camera View */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111' }]} />
          
          <View style={styles.scannerOverlay}>
             <View style={styles.scanFrame}>
                <Animated.View 
                  style={[
                    styles.scanLine,
                    {
                      transform: [{
                        translateY: scanAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 280] // Height of frame
                        })
                      }]
                    }
                  ]} 
                />
             </View>
             <View style={styles.scanLabelContainer}>
                <Text style={styles.scanLabelText}>Aponte para o QR Code</Text>
             </View>
          </View>

          <View style={styles.overlayHeader}>
             <TouchableOpacity onPress={() => setMode('hub')} style={styles.iconButton}>
               <ArrowLeft size={24} color="#FFF" />
             </TouchableOpacity>
             <TouchableOpacity style={styles.iconButton}>
               <Share2 size={24} color="#FFF" />
             </TouchableOpacity>
          </View>
          
          <View style={styles.scannerFooter}>
             <GlassButton onPress={() => setMode('amount')}>
               <Text style={styles.buttonText}>Digitar Código</Text>
             </GlassButton>
          </View>
      </View>
    );
  }

  // 3. TRANSFER
  if (mode === 'transfer') {
     return (
        <View style={styles.container}>
           <View style={styles.header}>
              <TouchableOpacity onPress={() => setMode('hub')} style={styles.backButton}>
                 <ArrowLeft size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Transferir</Text>
           </View>

           <ScrollView style={styles.content}>
              <TouchableOpacity onPress={() => {}} style={styles.listButton}>
                 <View style={styles.iconCircle}>
                   <Building2 size={20} color="#3A66FF" />
                 </View>
                 <View style={{ flex: 1 }}>
                    <Text style={styles.listButtonTitle}>Nova Transferência</Text>
                    <Text style={styles.listButtonSubtitle}>CPF, CNPJ, Agência e Conta</Text>
                 </View>
                 <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>

              <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>RECENTES</Text>
              {[1, 2, 3].map(i => (
                 <GlassCard key={i} onPress={() => setMode('amount')} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                       <View style={styles.favoriteAvatar}>
                          <Text style={styles.favoriteInitials}>JS</Text>
                       </View>
                       <View>
                          <Text style={styles.listButtonTitle}>João Silva</Text>
                          <Text style={styles.listButtonSubtitle}>Nubank • ***.123.456-**</Text>
                       </View>
                    </View>
                 </GlassCard>
              ))}
           </ScrollView>
        </View>
     );
  }

  // 4. AMOUNT
  if (mode === 'amount') {
     return (
        <View style={styles.container}>
           <View style={styles.header}>
              <TouchableOpacity onPress={() => setMode('hub')} style={styles.backButton}>
                 <ArrowLeft size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Qual o valor?</Text>
           </View>

           <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#9CA3AF', marginBottom: 8 }}>Saldo disponível: R$ 125.000,00</Text>
              <Text style={{ fontSize: 48, fontWeight: 'bold', color: '#FFF', marginBottom: 48 }}>
                {getFormattedAmount()}
              </Text>

              <View style={styles.keypad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <TouchableOpacity key={num} onPress={() => handleAmountInput(num.toString())} style={styles.key}>
                    <Text style={styles.keyText}>{num}</Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.key} />
                <TouchableOpacity onPress={() => handleAmountInput('0')} style={styles.key}>
                   <Text style={styles.keyText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleAmountInput('backspace')} style={styles.key}>
                   <ArrowLeft size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
           </View>

           <View style={{ padding: 24 }}>
              <GlassButton 
                disabled={parseInt(amount) === 0} 
                onPress={() => setMode('confirm')}
              >
                <Text style={styles.buttonText}>Continuar</Text>
              </GlassButton>
           </View>
        </View>
     );
  }

  // 5. CONFIRMATION
  if (mode === 'confirm') {
     return (
        <View style={styles.container}>
           {/* SCANNING OVERLAY */}
           {analysisState === 'scanning' && (
             <View style={[StyleSheet.absoluteFill, styles.overlayCenter]}>
                <View style={{ alignItems: 'center' }}>
                   <BrainCircuit size={48} color="#06B6D4" style={{ marginBottom: 24 }} />
                   <Text style={styles.overlayTitle}>Analisando Padrões</Text>
                   <Text style={styles.overlaySubtitle}>IA verificando segurança em tempo real</Text>
                </View>
             </View>
           )}

           {/* FLAGGED OVERLAY */}
           {analysisState === 'flagged' && fraudResult && (
             <View style={[StyleSheet.absoluteFill, styles.overlayCenter, { backgroundColor: '#0A0E17' }]}>
                <ShieldAlert size={64} color="#EF4444" style={{ marginBottom: 24 }} />
                <Text style={styles.overlayTitle}>Transação Interrompida</Text>
                <Text style={[styles.overlaySubtitle, { color: '#EF4444', fontWeight: 'bold' }]}>
                  Risco: {fraudResult.riskLevel}
                </Text>
                
                <GlassCard style={{ marginVertical: 32, borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(127, 29, 29, 0.1)' }}>
                   <Text style={{ color: '#FFF', textAlign: 'center' }}>
                      {fraudResult.reason || "Comportamento atípico detectado."}
                   </Text>
                   <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginTop: 16 }}>
                      Score: {fraudResult.score}/100
                   </Text>
                </GlassCard>

                <View style={{ width: '100%', gap: 16, paddingHorizontal: 24 }}>
                   <GlassButton onPress={() => Alert.alert("Biometria", "Validando...")}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                         <Lock size={18} color="#FFF" />
                         <Text style={styles.buttonText}>Desbloquear</Text>
                      </View>
                   </GlassButton>
                   <GlassButton onPress={() => { setAnalysisState('idle'); setMode('hub'); }}>
                      <Text style={styles.buttonText}>Cancelar</Text>
                   </GlassButton>
                </View>
             </View>
           )}

           <View style={styles.header}>
              <TouchableOpacity onPress={() => setMode('amount')} style={styles.backButton}>
                 <ArrowLeft size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Revisão</Text>
           </View>

           <View style={[styles.content, { padding: 24 }]}>
              <View style={styles.amountBox}>
                 <View style={styles.tag}>
                    <ShieldCheck size={12} color="#3A66FF" />
                    <Text style={styles.tagText}>PROTECTED BY AI</Text>
                 </View>
                 <Text style={{ color: '#9CA3AF', fontSize: 14 }}>Valor a transferir</Text>
                 <Text style={{ color: '#FFF', fontSize: 32, fontWeight: 'bold', marginTop: 4 }}>
                   {getFormattedAmount()}
                 </Text>
              </View>

              <GlassCard>
                 <Row label="Para" value="João Silva" />
                 <Row label="CPF" value="***.123.456-**" />
                 <Row label="Instituição" value="Nubank Payments" />
                 <Row label="Data" value="Agora" border={false} />
              </GlassCard>
           </View>

           <View style={{ padding: 24 }}>
              <GlassButton onPress={initiateTransfer} disabled={analysisState === 'scanning'}>
                <Text style={styles.buttonText}>Confirmar e Transferir</Text>
              </GlassButton>
           </View>
        </View>
     );
  }

  // 6. SUCCESS
  if (mode === 'success') {
     return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
           <View style={styles.successIcon}>
              <CheckCircle size={48} color="#10B981" />
           </View>
           <Text style={styles.successTitle}>Transferência Realizada!</Text>
           <Text style={styles.successSubtitle}>O valor foi enviado com sucesso.</Text>

           <View style={{ width: '100%', gap: 16, marginTop: 48 }}>
              <GlassButton onPress={() => setMode('hub')}>
                 <Text style={styles.buttonText}>Ver Comprovante</Text>
              </GlassButton>
              <GlassButton onPress={() => navigation.navigate('Dashboard')}>
                 <Text style={styles.buttonText}>Voltar ao Início</Text>
              </GlassButton>
           </View>
        </View>
     );
  }

  // 7. RECEIVE
  if (mode === 'receive') {
     return (
      <View style={styles.container}>
         <View style={styles.header}>
            <TouchableOpacity onPress={() => setMode('hub')} style={styles.backButton}>
               <ArrowLeft size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Receber Pix</Text>
         </View>

         <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <View style={styles.qrContainer}>
               <QrCode size={200} color="#000" />
            </View>
            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 24 }}>Don Paulo Ricardo</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 14 }}>Chave Aleatória</Text>
            
            <TouchableOpacity style={{ marginTop: 32, borderBottomWidth: 1, borderBottomColor: '#06B6D4' }}>
               <Text style={{ color: '#06B6D4', fontWeight: 'bold' }}>Definir valor específico</Text>
            </TouchableOpacity>
         </View>

         <View style={{ padding: 24, flexDirection: 'row', gap: 16 }}>
            <GlassButton style={{ flex: 1 }}>
               <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
                 <Copy size={18} color="#FFF" />
                 <Text style={styles.buttonText}>Copiar</Text>
               </View>
            </GlassButton>
            <GlassButton style={{ flex: 1 }}>
               <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
                 <Share2 size={18} color="#FFF" />
                 <Text style={styles.buttonText}>Enviar</Text>
               </View>
            </GlassButton>
         </View>
      </View>
     );
  }

  return null;
};

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

const Row = ({ label, value, border = true }: { label: string, value: string, border?: boolean }) => (
  <View style={{ 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 12, 
    borderBottomWidth: border ? 1 : 0, 
    borderBottomColor: 'rgba(255,255,255,0.05)' 
  }}>
    <Text style={{ color: '#9CA3AF' }}>{label}</Text>
    <Text style={{ color: '#FFF', fontWeight: '500' }}>{value}</Text>
  </View>
);

// ─── STYLES ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  containerBlack: {
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
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 24,
  },
  gridButton: {
    width: (width - 60) / 2,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  gridButtonText: {
    color: '#FFF',
    fontSize: 14,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 16,
    letterSpacing: 1,
  },
  favoritesScroll: {
    gap: 16,
    paddingBottom: 8,
  },
  favoriteItem: {
    alignItems: 'center',
    gap: 8,
    minWidth: 60,
  },
  favoriteAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3A66FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  favoriteInitials: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  favoriteName: {
    color: '#FFF',
    fontSize: 12,
  },
  // Scanner Styles
  scannerOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 280,
    height: 280,
    borderColor: '#06B6D4',
    borderWidth: 2,
    borderRadius: 24,
    overflow: 'hidden',
  },
  scanLine: {
    height: 2,
    backgroundColor: '#06B6D4',
    shadowColor: '#06B6D4',
    shadowOpacity: 1,
    shadowRadius: 10,
    width: '100%',
  },
  scanLabelContainer: {
    marginTop: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scanLabelText: {
    color: '#FFF',
    fontWeight: '500',
  },
  overlayHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  iconButton: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 24,
  },
  scannerFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 32,
    backgroundColor: '#0A0E17',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  // Transfer Styles
  listButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    gap: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(58, 102, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listButtonTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listButtonSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  // Keypad
  keypad: {
    width: '100%',
    maxWidth: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
  },
  key: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  keyText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '500',
  },
  // Confirmation
  amountBox: {
    backgroundColor: 'rgba(58, 102, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(58, 102, 255, 0.2)',
    marginBottom: 24,
  },
  tag: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(58, 102, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    color: '#3A66FF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  overlayCenter: {
    zIndex: 50,
    backgroundColor: 'rgba(10,14,23,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  overlaySubtitle: {
    color: '#9CA3AF',
    marginTop: 8,
  },
  // Success
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successSubtitle: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  // Receive
  qrContainer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 24,
    shadowColor: '#FFF',
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
