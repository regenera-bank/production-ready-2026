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

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, Alert } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

type Step = 'home' | 'send' | 'confirm';
const RECENTS = [
  { name: 'Ana Silva', key: 'ana@email.com', avatar: 'A' },
  { name: 'João Melo', key: '11 99999-0001', avatar: 'J' },
  { name: 'Maria Luz', key: '123.456.789-00', avatar: 'M' },
];

export default function PixScreen() {
  const [step, setStep] = useState<Step>('home');
  const [pixKey, setPixKey] = useState('');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');

  function handleConfirm() {
    Alert.alert('Pix enviado!', `R$ ${amount} enviado com sucesso.`, [
      { text: 'OK', onPress: () => { setStep('home'); setPixKey(''); setAmount(''); setDesc(''); } }
    ]);
  }

  if (step === 'confirm') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setStep('send')}><Text style={{ color: colors.cyan, fontSize: 16 }}>← Voltar</Text></TouchableOpacity>
          <Text style={s.title}>Confirmar Pix</Text>
        </View>
        <View style={s.confirmCard}>
          <Text style={s.confLabel}>DESTINATÁRIO</Text>
          <Text style={s.confValue}>{pixKey}</Text>
          <View style={s.confDivider}/>
          <Text style={s.confLabel}>VALOR</Text>
          <Text style={[s.confValue, { color: colors.cyan, fontSize: 28, fontWeight: '800' }]}>R$ {amount}</Text>
        </View>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <TouchableOpacity style={s.btnPrimary} onPress={handleConfirm}><Text style={s.btnPrimaryText}>Confirmar e Enviar</Text></TouchableOpacity>
          <TouchableOpacity style={s.btnSecondary} onPress={() => setStep('home')}><Text style={s.btnSecondaryText}>Cancelar</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'send') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setStep('home')}><Text style={{ color: colors.cyan, fontSize: 16 }}>← Voltar</Text></TouchableOpacity>
          <Text style={s.title}>Enviar Pix</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          <Text style={typography.label}>CHAVE PIX</Text>
          <TextInput style={s.input} value={pixKey} onChangeText={setPixKey} placeholder="CPF, e-mail, telefone ou chave aleatória" placeholderTextColor={colors.textDim} />
          <Text style={typography.label}>VALOR (R$)</Text>
          <TextInput style={s.input} value={amount} onChangeText={setAmount} placeholder="0,00" placeholderTextColor={colors.textDim} keyboardType="decimal-pad" />
          <Text style={typography.label}>DESCRIÇÃO (opcional)</Text>
          <TextInput style={s.input} value={desc} onChangeText={setDesc} placeholder="Referência do pagamento" placeholderTextColor={colors.textDim} />
          <TouchableOpacity style={[s.btnPrimary, (!pixKey || !amount) && { opacity: 0.4 }]} disabled={!pixKey || !amount} onPress={() => setStep('confirm')}>
            <Text style={s.btnPrimaryText}>Continuar</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}><Text style={s.title}>Pix</Text></View>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <View style={s.grid}>
          {[
            { icon: '', label: 'Enviar', action: () => setStep('send') },
            { icon: '', label: 'Receber', action: () => {} },
            { icon: '', label: 'Extrato Pix', action: () => {} },
            { icon: '', label: 'Minhas chaves', action: () => {} },
          ].map(item => (
            <TouchableOpacity key={item.label} style={s.gridItem} onPress={item.action}>
              <View style={s.gridIcon} />
              <Text style={s.gridLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[typography.label, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>RECENTES</Text>
        {RECENTS.map((r, i) => (
          <TouchableOpacity key={i} style={s.recentRow} onPress={() => { setPixKey(r.key); setStep('send'); }}>
            <View style={s.recentAvatar}><Text style={s.recentAvatarText}>{r.avatar}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.body, color: colors.text, fontWeight: '600' }}>{r.name}</Text>
              <Text style={typography.caption}>{r.key}</Text>
            </View>
            <Text style={{ color: colors.textDim, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  title: { ...typography.h2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridItem: { width: '47%', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  gridIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: colors.cyanDim, borderWidth: 1, borderColor: colors.cyanBorder, alignItems: 'center', justifyContent: 'center' },
  gridLabel: { ...typography.body, color: colors.text, fontWeight: '600' },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  recentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.indigoDim, borderWidth: 1, borderColor: colors.indigoBorder, alignItems: 'center', justifyContent: 'center' },
  recentAvatarText: { color: colors.indigo, fontWeight: '700', fontSize: 16 },
  input: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, color: colors.text, borderWidth: 1, borderColor: colors.border, fontSize: 15 },
  btnPrimary: { backgroundColor: colors.cyan, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  btnPrimaryText: { color: colors.background, fontWeight: '700', fontSize: 16 },
  btnSecondary: { borderRadius: radius.md, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  btnSecondaryText: { color: colors.textMuted, fontSize: 15 },
  confirmCard: { margin: spacing.lg, backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  confLabel: { ...typography.label },
  confValue: { ...typography.body, color: colors.text, fontSize: 16, fontWeight: '600' },
  confDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
});
