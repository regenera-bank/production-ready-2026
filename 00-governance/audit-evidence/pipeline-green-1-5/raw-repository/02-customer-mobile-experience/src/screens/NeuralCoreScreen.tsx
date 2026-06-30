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
} from 'react-native';
import { neuralApi } from '../services/api';
import { colors, spacing, radius, typography } from '../theme';

interface Message { role: 'user' | 'assistant'; content: string; ts: string; }

const INITIAL: Message = {
  role: 'assistant',
  content: 'Olá! Sou a Raphaela, sua assistente financeira do Regenera Bank. Detectei que seu Neural Score está em 945 — excelente! Tenho 3 insights financeiros para você hoje. Como posso ajudar? 💜',
  ts: new Date().toISOString(),
};

const QUICK = ['Analisar meus gastos', 'Oportunidade de investimento', 'Simular empréstimo', 'Otimizar carteira'];

function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
}

export default function NeuralCoreScreen({ navigation }: any) {
  const [messages, setMessages] = useState<Message[]>([INITIAL]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    neuralApi.insight()
      .then(d => setInsight(d.insight || d.summary || null))
      .catch(() => {});
  }, []);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text.trim(), ts: new Date().toISOString() };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const d = await neuralApi.chat(text.trim());
      setMessages(p => [...p, {
        role: 'assistant',
        content: d.response || 'Não consegui processar sua mensagem.',
        ts: d.timestamp || new Date().toISOString(),
      }]);
    } catch {
      setMessages(p => [...p, {
        role: 'assistant',
        content: 'Erro de conexão com o Neural Core. Tente novamente.',
        ts: new Date().toISOString(),
      }]);
    }
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={s.backBtn}>
          <Text style={{ color: colors.indigo, fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <View style={s.headerDot}><Text style={{ color: colors.indigo, fontSize: 16 }}>●</Text></View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={s.headerTitle}>Neural Core</Text>
            <View style={s.activeBadge}><Text style={s.activeBadgeText}>● ACTIVE</Text></View>
          </View>
          <Text style={s.headerSub}>Raphaela — Assistente IA Gemini</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {/* Insight Card */}
          {insight && (
            <View style={s.insightCard}>
              <Text style={s.insightLabel}>💡 INSIGHT DO DIA</Text>
              <Text style={s.insightText}>{insight}</Text>
            </View>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <View key={i} style={{ alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <View style={[s.bubble, msg.role === 'user' ? s.bubbleUser : s.bubbleAssistant]}>
                <Text style={[s.bubbleText, { color: msg.role === 'user' ? '#e0f7ff' : '#e0e7ff' }]}>
                  {msg.content}
                </Text>
              </View>
              <Text style={s.msgTime}>
                {msg.role === 'assistant' ? 'Raphaela · ' : ''}{fmtTime(msg.ts)}
              </Text>
            </View>
          ))}

          {/* Loading dots */}
          {loading && (
            <View style={[s.bubbleAssistant, { padding: spacing.sm }]}>
              <View style={{ flexDirection: 'row', gap: 5 }}>
                {[0, 1, 2].map(n => <View key={n} style={s.dot} />)}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Actions */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.quickScroll}
          contentContainerStyle={{ padding: spacing.sm, gap: spacing.sm }}
        >
          {QUICK.map(q => (
            <TouchableOpacity key={q} onPress={() => send(q)} disabled={loading} style={s.quickBtn}>
              <Text style={s.quickText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Pergunte à Raphaela..."
            placeholderTextColor={colors.textDim}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || loading) && { opacity: 0.3 }]}
            disabled={!input.trim() || loading}
            onPress={() => send(input)}
          >
            {loading
              ? <ActivityIndicator size="small" color={colors.background} />
              : <Text style={{ color: colors.background, fontWeight: '900', fontSize: 18 }}>→</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: '#1e1b4b', borderBottomWidth: 1, borderBottomColor: colors.indigoBorder },
  backBtn: { padding: 4 },
  headerDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.indigoDim, borderWidth: 1, borderColor: colors.indigoBorder, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.h3, color: '#e0e7ff' },
  activeBadge: { backgroundColor: colors.emeraldDim, borderWidth: 1, borderColor: colors.emerald, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  activeBadgeText: { color: colors.emerald, fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  headerSub: { ...typography.caption, color: '#818cf8' },
  insightCard: { backgroundColor: colors.indigoDim, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.indigoBorder, marginBottom: spacing.sm },
  insightLabel: { ...typography.label, color: '#818cf8', marginBottom: 4 },
  insightText: { ...typography.body, color: '#e0e7ff', lineHeight: 20 },
  bubble: { maxWidth: '82%', padding: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.lg, marginBottom: 2 },
  bubbleUser: { backgroundColor: 'rgba(0,240,255,0.12)', borderWidth: 1, borderColor: 'rgba(0,240,255,0.25)', borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: colors.indigoDim, borderWidth: 1, borderColor: colors.indigoBorder, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 22 },
  msgTime: { ...typography.caption, fontSize: 10, marginBottom: spacing.sm, opacity: 0.6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.indigo },
  quickScroll: { flexGrow: 0, borderTopWidth: 1, borderTopColor: 'rgba(99,102,241,0.2)' },
  quickBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.indigoBorder, backgroundColor: colors.indigoDim },
  quickText: { color: '#a5b4fc', fontSize: 12 },
  inputRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.indigoBorder, alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: colors.indigoDim, borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: 14, borderWidth: 1, borderColor: colors.indigoBorder, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.indigo, alignItems: 'center', justifyContent: 'center' },
});
