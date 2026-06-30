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

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Modal, Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography } from '../theme';
import { useStore } from '../store/useStore';
import { neuralApi } from '../services/api';
import { Gamepad2, Star, Award, Coins, ArrowLeft, Send, MessageSquare } from 'lucide-react-native';

interface Message { role: 'user' | 'assistant'; content: string; ts: string; }

interface Badge {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  points: number;
}

const INITIAL_BADGES: Badge[] = [
  { id: 'first_pix', title: 'Primeiro PIX', description: 'Recebeu seu primeiro PIX na conta', unlocked: true, points: 50 },
  { id: 'saver', title: 'Super Poupador', description: 'Guardou dinheiro no cofre pela primeira vez', unlocked: false, points: 100 },
  { id: 'master', title: 'Mestre da Economia', description: 'Completou todas as missões da semana', unlocked: false, points: 200 }
];

export default function KidsScreen() {
  const navigation = useNavigation();
  const { globalBalance, updateBalance, user } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Oi! Sou a Raphaela, sua mentora financeira! Aqui você ganha moedas e conquistas para aprender a cuidar do seu dinheirinho. Pode me fazer qualquer pergunta sobre dinheiro!',
      ts: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [badges, setBadges] = useState<Badge[]>(INITIAL_BADGES);
  const [showCelebration, setShowCelebration] = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState<Badge | null>(null);
  const [points, setPoints] = useState(50);
  const scrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  // Simulate receiving a PIX to demonstrate gamification & auto-unlocking badge
  const simulateReceivePix = () => {
    const amount = Math.floor(Math.random() * 50) + 10;
    updateBalance(amount * 100); // add to balance in cents
    setPoints(prev => prev + 25);

    // Check if we can unlock "Super Poupador"
    const hasSaver = badges.find(b => b.id === 'saver')?.unlocked;
    if (!hasSaver) {
      const updated = badges.map(b => {
        if (b.id === 'saver') {
          setUnlockedBadge(b);
          setShowCelebration(true);
          return { ...b, unlocked: true };
        }
        return b;
      });
      setBadges(updated);
      setPoints(prev => prev + 100);
    }
  };

  async function sendToRaphaelaKids(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text.trim(), ts: new Date().toISOString() };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setLoading(true);

    // Wrap the message in a child-friendly instruction block so Gemini translates to kids language
    const kidsInstruction = `Você é a Raphaela Kids, mentora financeira infantil. Responda à pergunta a seguir de forma muito simples e divertida, usando analogias de brinquedos, doces ou jogos, para uma criança de 8 anos: "${text.trim()}"`;

    try {
      const res = await neuralApi.chat(kidsInstruction, user?.neuralId || 'kids-user-123');
      // Unwrap response based on API client return structure
      const rawData = (res as any).data || res;
      const content = rawData.response || rawData.text || 'Não consegui processar agora.';
      
      setMessages(p => [...p, {
        role: 'assistant',
        content: content,
        ts: rawData.timestamp || new Date().toISOString()
      }]);
    } catch (err) {
      setMessages(p => [...p, {
        role: 'assistant',
        content: 'Ops, meus sistemas de brinquedo deram uma travadinha. Tenta me perguntar de novo!',
        ts: new Date().toISOString()
      }]);
    }
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ArrowLeft stroke="#10b981" size={24} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Regenera Kids</Text>
        <View style={s.pointsBadge}>
          <Star fill="#eab308" color="#eab308" size={12} />
          <Text style={s.pointsText}>{points} pts</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView ref={scrollRef} style={s.scroll} contentContainerStyle={{ padding: spacing.md }} showsVerticalScrollIndicator={false}>
          
          {/* Main Piggy Bank Card */}
          <Animated.View style={[s.kidsCard, { transform: [{ scale: pulseAnim }] }]}>
            <View style={s.cardHeader}>
              <Gamepad2 stroke="#fff" size={24} />
              <Text style={s.kidsCardLabel}>COFRINHO DIGITAL</Text>
            </View>
            <Text style={s.kidsBalance}>R$ {(globalBalance / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
            <TouchableOpacity onPress={simulateReceivePix} style={s.receiveBtn}>
              <Coins stroke="#10b981" size={16} />
              <Text style={s.receiveBtnText}>Simular Receber PIX 💰</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Gamified Merit Badges */}
          <Text style={s.sectionTitle}>MINHAS CONQUISTAS (BADGES)</Text>
          <View style={s.badgesContainer}>
            {badges.map(b => (
              <View key={b.id} style={[s.badgeCard, !b.unlocked && s.badgeLocked]}>
                <Award stroke={b.unlocked ? '#eab308' : '#475569'} size={32} />
                <Text style={[s.badgeTitle, !b.unlocked && s.badgeTitleLocked]}>{b.title}</Text>
                <Text style={s.badgeDesc}>{b.description}</Text>
                {b.unlocked ? (
                  <Text style={s.badgePts}>+{b.points} XP</Text>
                ) : (
                  <Text style={s.badgeLockedText}>Bloqueado</Text>
                )}
              </View>
            ))}
          </View>

          {/* Kids AGI Chatbot Mentor */}
          <View style={s.chatHeader}>
            <MessageSquare stroke="#10b981" size={18} />
            <Text style={s.chatTitle}>PERGUNTE À RAPHAELA KIDS</Text>
          </View>

          <View style={s.chatBox}>
            {messages.map((msg, i) => (
              <View key={i} style={[s.bubble, msg.role === 'user' ? s.bubbleUser : s.bubbleAssistant]}>
                <Text style={s.bubbleText}>{msg.content}</Text>
              </View>
            ))}
            {loading && <ActivityIndicator color="#10b981" style={{ marginVertical: 8 }} />}
          </View>

          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              value={input}
              onChangeText={setInput}
              placeholder="O que é poupança? Como funciona o PIX?..."
              placeholderTextColor="#475569"
            />
            <TouchableOpacity
              style={[s.sendBtn, !input.trim() && { opacity: 0.5 }]}
              disabled={!input.trim() || loading}
              onPress={() => sendToRaphaelaKids(input)}
            >
              <Send stroke="#080d1a" size={16} />
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Badge Unlocked Celebration Modal */}
      <Modal visible={showCelebration} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Award stroke="#eab308" size={64} style={{ marginBottom: 12 }} />
            <Text style={s.modalTitle}> NOVA CONQUISTA! </Text>
            <Text style={s.modalBadgeName}>{unlockedBadge?.title}</Text>
            <Text style={s.modalDesc}>{unlockedBadge?.description}</Text>
            <Text style={s.modalPoints}>+{unlockedBadge?.points} XP adicionados!</Text>
            <TouchableOpacity onPress={() => setShowCelebration(false)} style={s.closeBtn}>
              <Text style={s.closeBtnText}>Eba! Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(16,185,129,0.1)' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(234,179,8,0.1)', borderWidth: 1, borderColor: '#eab308', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pointsText: { color: '#eab308', fontSize: 11, fontWeight: '700' },
  scroll: { flex: 1 },
  kidsCard: { backgroundColor: '#10b981', borderRadius: 24, padding: spacing.lg, marginVertical: spacing.md, shadowColor: '#10b981', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  kidsCardLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 1.5 },
  kidsBalance: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: spacing.md },
  receiveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', paddingVertical: 10, borderRadius: 16 },
  receiveBtnText: { color: '#10b981', fontSize: 12, fontWeight: '800' },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: '#64748b', tracking: 1.5, marginBottom: spacing.sm, marginTop: spacing.md },
  badgesContainer: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  badgeCard: { flex: 1, backgroundColor: '#0d1526', borderWidth: 1, borderColor: 'rgba(234,179,8,0.3)', borderRadius: 20, padding: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  badgeLocked: { borderColor: 'rgba(255,255,255,0.05)', opacity: 0.4 },
  badgeTitle: { fontSize: 11, fontWeight: '700', color: '#fff', marginTop: 6, textAlign: 'center' },
  badgeTitleLocked: { color: '#64748b' },
  badgeDesc: { fontSize: 8, color: '#475569', textAlign: 'center', marginTop: 2 },
  badgePts: { fontSize: 10, fontWeight: '800', color: '#eab308', marginTop: 6 },
  badgeLockedText: { fontSize: 10, color: '#475569', marginTop: 6 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md, marginBottom: spacing.sm },
  chatTitle: { fontSize: 10, fontWeight: '800', color: '#10b981', letterSpacing: 1 },
  chatBox: { backgroundColor: '#0d1526', borderRadius: 20, padding: spacing.md, gap: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: 'rgba(16,185,129,0.1)' },
  bubble: { padding: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 16, maxWidth: '85%' },
  bubbleUser: { backgroundColor: 'rgba(16,185,129,0.15)', borderBottomRightRadius: 2, alignSelf: 'flex-end' },
  bubbleAssistant: { backgroundColor: '#020617', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', borderBottomLeftRadius: 2, alignSelf: 'flex-start' },
  bubbleText: { color: '#e2e8f0', fontSize: 13, lineHeight: 18 },
  inputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.xl },
  input: { flex: 1, backgroundColor: '#0d1526', borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: 10, color: '#fff', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: '#0d1526', borderWidth: 1, borderColor: '#eab308', borderRadius: 32, padding: spacing.xl, alignItems: 'center', width: '100%', maxWidth: 320 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#eab308', marginBottom: 4 },
  modalBadgeName: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 },
  modalPoints: { fontSize: 14, fontWeight: '700', color: '#10b981', marginTop: 12 },
  closeBtn: { marginTop: 24, backgroundColor: '#10b981', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  closeBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 }
});
