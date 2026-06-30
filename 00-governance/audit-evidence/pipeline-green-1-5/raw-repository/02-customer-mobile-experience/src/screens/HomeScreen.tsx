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

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, radius, typography } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const USER_ID = 'user-2098233287';

interface Account { id: string; name: string; number: string; balance?: number; currency?: string; }
interface Transaction { id: string; date: string; description: string; amount: number; currency: string; debit: boolean; }

function fmt(value: number, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
}

function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return d; }
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selected, setSelected] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite');
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const res = await fetch(`${API_BASE}/v1/open-finance/accounts`);
      if (res.ok) {
        const data = await res.json();
        const list: Account[] = data.accounts || data || [];
        setAccounts(list);
        if (list.length > 0) { setSelected(list[0]); fetchTx(list[0].id); }
      }
    } catch {}
    setLoading(false);
  }

  async function fetchTx(accountId: string) {
    setTxLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/open-finance/transactions?accountId=${accountId}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions((data.transactions || data || []).slice(0, 8));
      }
    } catch {}
    setTxLoading(false);
  }

  const total = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.hero}>
          <Text style={s.greet}>{greeting}, usuário</Text>
          <Text style={s.balance}>{loading ? '---' : fmt(total)}</Text>
          <Text style={s.balLabel}>Saldo consolidado</Text>
          <View style={s.quickRow}>
            {[
              {icon:'💸',label:'Pix', onPress: () => navigation.navigate('Pix' as any)},
              {icon:'🧸',label:'Kids', onPress: () => navigation.navigate('Kids' as any)},
              {icon:'💳',label:'Cartões', onPress: () => navigation.navigate('Cartoes' as any)},
              {icon:'➕',label:'Mais', onPress: () => {}},
            ].map(i=>(
              <TouchableOpacity key={i.label} style={s.quickItem} onPress={i.onPress}>
                <View style={s.quickIcon}>
                  <Text style={s.quickIconText}>{i.icon}</Text>
                </View>
                <Text style={s.quickLabel}>{i.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.body}>
          {/* Accounts */}
          {accounts.length > 0 && (
            <>
              <Text style={s.sectionTitle}>SUAS CONTAS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hScroll}>
                {accounts.map(acc => (
                  <TouchableOpacity
                    key={acc.id}
                    onPress={() => { setSelected(acc); fetchTx(acc.id); }}
                    style={[s.accCard, selected?.id === acc.id && s.accCardActive]}
                  >
                    <Text style={s.accNumber}>{acc.number || acc.id.slice(0,8)}</Text>
                    <Text style={s.accName}>{acc.name || 'Conta'}</Text>
                    <Text style={s.accBalance}>{acc.balance != null ? fmt(acc.balance, acc.currency) : '---'}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={[s.sectionTitle, {marginTop: spacing.md}]}>ÚLTIMAS MOVIMENTAÇÕES</Text>

          {txLoading && <ActivityIndicator color={colors.cyan} style={{marginVertical: 24}} />}

          {!txLoading && transactions.map((tx, i) => (
            <View key={i} style={s.txRow}>
              <View style={[s.txIcon, {backgroundColor: tx.debit ? colors.redDim : colors.emeraldDim}]} />
              <View style={s.txMeta}>
                <Text style={s.txDesc} numberOfLines={1}>{tx.description}</Text>
                <Text style={s.txDate}>{fmtDate(tx.date)}</Text>
              </View>
              <Text style={[s.txAmt, {color: tx.debit ? colors.red : colors.emerald}]}>
                {tx.debit ? '-' : '+'}{fmt(Math.abs(tx.amount), tx.currency)}
              </Text>
            </View>
          ))}

          {!txLoading && transactions.length === 0 && (
            <Text style={s.empty}>Nenhuma transação encontrada.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  hero: { backgroundColor: colors.card, padding: spacing.lg, paddingBottom: spacing.xl },
  greet: { ...typography.caption, marginBottom: 4 },
  balance: { fontSize: 34, fontWeight: '800', color: colors.cyan, marginBottom: 2 },
  balLabel: { ...typography.caption, marginBottom: spacing.md },
  quickRow: { flexDirection: 'row', gap: 12, marginTop: spacing.md },
  quickItem: { flex: 1, alignItems: 'center', gap: 6 },
  quickIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,240,255,0.08)', borderWidth: 1, borderColor: colors.cyanBorder, alignItems: 'center', justifyContent: 'center' },
  quickIconText: { color: colors.cyan, fontSize: 18 },
  quickLabel: { ...typography.caption },
  body: { padding: spacing.md },
  sectionTitle: { ...typography.label, marginBottom: spacing.sm },
  hScroll: { marginHorizontal: -spacing.md, paddingHorizontal: spacing.md },
  accCard: { minWidth: 160, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, marginRight: spacing.sm },
  accCardActive: { borderColor: colors.cyanBorder, backgroundColor: 'rgba(0,240,255,0.08)' },
  accNumber: { ...typography.caption, marginBottom: 4 },
  accName: { ...typography.body, color: colors.text, fontWeight: '600', marginBottom: 4 },
  accBalance: { fontSize: 16, fontWeight: '700', color: colors.cyan },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  txIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txMeta: { flex: 1 },
  txDesc: { ...typography.body, color: colors.text, fontWeight: '500', marginBottom: 2 },
  txDate: { ...typography.caption },
  txAmt: { fontWeight: '700', fontSize: 14 },
  empty: { ...typography.body, textAlign: 'center', paddingVertical: 32 },
});
