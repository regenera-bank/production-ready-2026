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
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../theme';

const MENU_ITEMS = [
  { label: 'Início' },
  { label: 'Extrato' },
  { label: 'Cartões' },
  { label: 'Pix' },
  { label: 'Neural Core IA' },
  { label: 'Open Finance' },
  { label: 'Notificações' },
  { label: 'Configurações' },
];

interface Props {
  onClose?: () => void;
  onNavigate?: (screen: string) => void;
}

export default function SideMenuScreen({ onClose, onNavigate }: Props) {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View style={s.avatar}><Text style={s.avatarText}>R</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>Usuário Regenera</Text>
          <Text style={s.email}>user@regenera.bank</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
          <Text style={{ color: colors.textDim, fontSize: 20 }}>×</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={s.scroll}>
        {MENU_ITEMS.map((item, i) => (
          <TouchableOpacity key={i} style={s.item} onPress={() => onNavigate?.(item.label)}>
            <Text style={s.itemLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={s.footer}>
        <View style={s.badge}><Text style={s.badgeText}>● ONLINE</Text></View>
        <Text style={s.version}>Regenera Bank v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.card },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.indigoDim, borderWidth: 1, borderColor: colors.indigoBorder, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.indigo, fontSize: 20, fontWeight: '700' },
  name: { ...typography.h3 },
  email: { ...typography.caption },
  closeBtn: { padding: 8 },
  scroll: { flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  itemIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  itemLabel: { ...typography.body, color: colors.text, fontSize: 15 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { backgroundColor: colors.emeraldDim, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.emerald },
  badgeText: { color: colors.emerald, fontSize: 10, fontWeight: '700' },
  version: { ...typography.caption },
});
