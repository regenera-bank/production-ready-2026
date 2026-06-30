import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { colors, spacing, radius, typography } from '../../../theme';

interface Notif { id: string; title: string; body: string; type: 'info'|'alert'|'success'; read: boolean; ts: string; }

const MOCK: Notif[] = [
  { id: '1', title: 'Transação detectada', body: 'Débito de R$ 127,50 em SUPERMERCADO EXTRA.', type: 'info', read: false, ts: new Date(Date.now()-1800000).toISOString() },
  { id: '2', title: 'Insight da Raphaela', body: 'Gastos com alimentação 23% acima do mês passado.', type: 'alert', read: false, ts: new Date(Date.now()-7200000).toISOString() },
  { id: '3', title: 'Conta vinculada', body: 'Conta bancária conectada via Open Finance.', type: 'success', read: true, ts: new Date(Date.now()-18000000).toISOString() },
];

const CFG = {
  info:    { icon: '', color: colors.indigo, bg: colors.indigoDim, border: colors.indigoBorder },
  alert:   { icon: '', color: colors.amber,  bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  success: { icon: '', color: colors.emerald, bg: colors.emeraldDim, border: colors.emerald },
};

function ago(iso: string) {
  const d = Math.floor((Date.now()-new Date(iso).getTime())/1000);
  if (d < 60) return 'agora'; if (d < 3600) return `${Math.floor(d/60)}min`; return `${Math.floor(d/3600)}h`;
}

export default function NotificationsScreen() {
  const [items, setItems] = useState(MOCK);
  const unread = items.filter(n => !n.read).length;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Notificações</Text>
        {unread > 0 && (
          <TouchableOpacity onPress={() => setItems(p => p.map(n => ({ ...n, read: true })))} style={s.markBtn}>
            <Text style={s.markText}>Marcar tudo</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}>
        {items.map(notif => {
          const cfg = CFG[notif.type];
          return (
            <TouchableOpacity key={notif.id} onPress={() => setItems(p => p.map(n => n.id === notif.id ? { ...n, read: true } : n))}
              style={[s.card, { backgroundColor: notif.read ? colors.card : cfg.bg, borderColor: notif.read ? colors.border : cfg.border }]}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[s.cardTitle, { color: notif.read ? colors.textMuted : colors.text }]}>{notif.title}</Text>
                <Text style={s.cardBody} numberOfLines={2}>{notif.body}</Text>
                <Text style={s.cardTime}>{ago(notif.ts)}</Text>
              </View>
              {!notif.read && <View style={[s.dot, { backgroundColor: cfg.color }]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingBottom: spacing.sm },
  title: { ...typography.h2 },
  markBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.cyanBorder, backgroundColor: colors.cyanDim },
  markText: { color: colors.cyan, fontSize: 12, fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600' },
  cardBody: { ...typography.body, lineHeight: 18 },
  cardTime: { ...typography.caption, fontSize: 10, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
});
