import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { colors, spacing, radius, typography } from '../../../theme';

interface Card {
  id: string; label: string; number: string;
  expiry: string; limit: number; used: number; type: 'credit'|'debit';
}

const MOCK_CARDS: Card[] = [
  { id: '1', label: 'Regenera Platinum', number: '•••• •••• •••• 4821', expiry: '12/28', limit: 15000, used: 4320.5, type: 'credit' },
  { id: '2', label: 'Regenera Débito',   number: '•••• •••• •••• 7643', expiry: '08/27', limit: 5000,  used: 1200,   type: 'debit'  },
];

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function CardsScreen() {
  const [selected, setSelected] = useState<Card>(MOCK_CARDS[0]);
  const usedPct = Math.min((selected.used / selected.limit) * 100, 100);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Cartões</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.carousel} contentContainerStyle={s.carouselContent}>
        {MOCK_CARDS.map(card => (
          <TouchableOpacity key={card.id} onPress={() => setSelected(card)}>
            <View style={[s.card, selected.id === card.id && s.cardActive, { backgroundColor: card.type === 'credit' ? '#1e1b4b' : '#0f2027' }]}>
              <View style={s.cardTop}>
                <Text style={s.cardLabel}>{card.label}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{card.type === 'credit' ? 'CRÉDITO' : 'DÉBITO'}</Text>
              </View>
              <Text style={s.cardNumber}>{card.number}</Text>
              <View style={s.cardBottom}>
                <Text style={s.cardExpiry}>Validade {card.expiry}</Text>
                <Text style={s.cardBank}>REGENERA</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView style={s.body} contentContainerStyle={{ padding: spacing.md }}>
        {selected.type === 'credit' && (
          <View style={s.limitCard}>
            <View style={s.limitRow}>
              <Text style={typography.label}>LIMITE DISPONÍVEL</Text>
              <Text style={{ color: colors.emerald, fontWeight: '700', fontSize: 16 }}>{fmt(selected.limit - selected.used)}</Text>
            </View>
            <View style={s.barTrack}>
              <View style={[s.barFill, { width: `${usedPct}%` as any }]} />
            </View>
            <View style={s.limitRow}>
              <Text style={typography.caption}>Usado: {fmt(selected.used)}</Text>
              <Text style={typography.caption}>Limite: {fmt(selected.limit)}</Text>
            </View>
          </View>
        )}
        {[
          { label: 'Bloquear cartão' },
          { label: 'Alterar senha' },
          { label: 'Segunda via' },
          { label: 'Cancelar cartão' },
        ].map(item => (
          <TouchableOpacity key={item.label} style={s.action}>
            <Text style={s.actionLabel}>{item.label}</Text>
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
  carousel: { flexGrow: 0 },
  carouselContent: { padding: spacing.md, gap: spacing.md },
  card: { width: 300, height: 175, borderRadius: 20, padding: spacing.lg, justifyContent: 'space-between', marginRight: spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cardActive: { borderColor: colors.cyan, shadowColor: colors.cyan, shadowRadius: 12, shadowOpacity: 0.3, elevation: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLabel: { color: colors.text, fontWeight: '700', fontSize: 15 },
  cardNumber: { color: colors.textMuted, fontSize: 16, letterSpacing: 2, textAlign: 'center' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardExpiry: { color: colors.textMuted, fontSize: 12 },
  cardBank: { color: colors.cyan, fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  body: { flex: 1 },
  limitCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  limitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.emerald },
  action: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  actionLabel: { flex: 1, ...typography.body, color: colors.text, fontSize: 15 },
});
