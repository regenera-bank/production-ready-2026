import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView, TextInput,
} from 'react-native';
import { colors, spacing, radius, typography } from '../../../theme';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface Transaction {
  id: string; date: string; description: string;
  amount: number; currency: string; debit: boolean;
}

function fmt(v: number, c = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: c }).format(v);
}
function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return d; }
}

export default function ExtratoScreen() {
  const [all, setAll] = useState<Transaction[]>([]);
  const [filtered, setFiltered] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all'|'debit'|'credit'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    let list = all;
    if (filter === 'debit') list = list.filter(t => t.debit);
    if (filter === 'credit') list = list.filter(t => !t.debit);
    if (search.trim()) list = list.filter(t => t.description.toLowerCase().includes(search.toLowerCase()));
    setFiltered(list);
  }, [all, filter, search]);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/open-finance/transactions`);
      if (res.ok) {
        const data = await res.json();
        setAll(data.transactions || data || []);
      }
    } catch {}
    setLoading(false);
  }

  const totalDebit = filtered.filter(t=>t.debit).reduce((s,t)=>s+t.amount,0);
  const totalCredit = filtered.filter(t=>!t.debit).reduce((s,t)=>s+t.amount,0);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Extrato</Text>
        <View style={s.summary}>
          <View style={s.sumItem}>
            <Text style={s.sumLabel}>Entradas</Text>
            <Text style={[s.sumValue,{color:colors.emerald}]}>+{fmt(totalCredit)}</Text>
          </View>
          <View style={s.sumDivider}/>
          <View style={s.sumItem}>
            <Text style={s.sumLabel}>Saídas</Text>
            <Text style={[s.sumValue,{color:colors.red}]}>-{fmt(totalDebit)}</Text>
          </View>
        </View>
      </View>

      <View style={s.controls}>
        <TextInput
          style={s.search}
          placeholder="Buscar transação..."
          placeholderTextColor={colors.textDim}
          value={search}
          onChangeText={setSearch}
        />
        <View style={s.filterRow}>
          {(['all','debit','credit'] as const).map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[s.filterBtn, filter===f && s.filterBtnActive]}
            >
              <Text style={[s.filterText, filter===f && s.filterTextActive]}>
                {f==='all'?'Todas':f==='debit'?'Débito':'Crédito'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading
        ? <ActivityIndicator color={colors.cyan} style={{marginTop:32}}/>
        : (
          <ScrollView style={{flex:1}} contentContainerStyle={{padding:spacing.md}}>
            {filtered.length === 0 && (
              <Text style={s.empty}>Nenhuma transação encontrada.</Text>
            )}
            {filtered.map((tx,i) => (
              <View key={i} style={s.row}>
                <View style={[s.icon,{backgroundColor: tx.debit?colors.redDim:colors.emeraldDim}]} />
                <View style={s.meta}>
                  <Text style={s.desc} numberOfLines={1}>{tx.description}</Text>
                  <Text style={s.date}>{fmtDate(tx.date)}</Text>
                </View>
                <Text style={[s.amt,{color: tx.debit?colors.red:colors.emerald}]}>
                  {tx.debit?'-':'+'}{fmt(Math.abs(tx.amount),tx.currency)}
                </Text>
              </View>
            ))}
          </ScrollView>
        )
      }
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {flex:1, backgroundColor:colors.background},
  header: {padding:spacing.lg, backgroundColor:colors.card, borderBottomWidth:1, borderBottomColor:colors.border},
  title: { ...typography.h2, marginBottom:spacing.md},
  summary: {flexDirection:'row', backgroundColor:'rgba(0,0,0,0.2)', borderRadius:radius.md, padding:spacing.md},
  sumItem: {flex:1, alignItems:'center'},
  sumLabel: {...typography.caption},
  sumValue: {fontSize:16, fontWeight:'700', marginTop:2},
  sumDivider: {width:1, backgroundColor:colors.border},
  controls: {padding:spacing.md, gap:spacing.sm},
  search: {backgroundColor:colors.card, borderRadius:radius.md, padding:spacing.sm, paddingHorizontal:spacing.md, color:colors.text, borderWidth:1, borderColor:colors.border, fontSize:14},
  filterRow: {flexDirection:'row', gap:spacing.sm},
  filterBtn: {paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:colors.border},
  filterBtnActive: {backgroundColor:colors.cyanDim, borderColor:colors.cyanBorder},
  filterText: {...typography.caption, color:colors.textDim},
  filterTextActive: {color:colors.cyan, fontWeight:'600'},
  row: {flexDirection:'row', alignItems:'center', paddingVertical:12, borderBottomWidth:1, borderBottomColor:colors.border},
  icon: {width:36,height:36,borderRadius:10,alignItems:'center',justifyContent:'center',marginRight:12},
  meta: {flex:1},
  desc: {...typography.body, color:colors.text, fontWeight:'500', marginBottom:2},
  date: {...typography.caption},
  amt: {fontWeight:'700', fontSize:14},
  empty: {...typography.body, textAlign:'center', paddingVertical:32},
});
