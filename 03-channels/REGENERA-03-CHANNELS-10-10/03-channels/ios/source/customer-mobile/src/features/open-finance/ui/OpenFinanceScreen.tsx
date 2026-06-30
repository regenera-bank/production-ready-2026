import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, TextInput, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { openFinanceApi } from '../../../services/api';
import { colors, spacing, radius, typography } from '../../../theme';

interface Provider { code: string; name: string; country: string; }
interface Account { id: string; name: string; number: string; balance?: number; currency?: string; }
interface Transaction { id: string; date: string; detail: string; debit: number; credit: number; balance: number; currency: string; }

type State = 'disconnected' | 'connecting' | 'connected';

function fmt(v: number, c = 'USD') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: c }).format(v);
}

export default function OpenFinanceScreen({ navigation }: any) {
  const [status, setStatus] = useState<State>('disconnected');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [provider, setProvider] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sessionKey, setSessionKey] = useState('');

  useEffect(() => {
    // Verifica se já tem sessão salva
    AsyncStorage.getItem('prometeo_key').then(k => {
      if (k) { setSessionKey(k); loadAccounts(k); }
    });
    // Carrega providers
    openFinanceApi.providers()
      .then(d => setProviders(d.providers || []))
      .catch(() => {});
  }, []);

  async function loadAccounts(key: string) {
    setStatus('connecting');
    try {
      const d = await openFinanceApi.accounts(key);
      const list: Account[] = d.accounts || [];
      setAccounts(list);
      setStatus('connected');
    } catch {
      await AsyncStorage.removeItem('prometeo_key');
      setStatus('disconnected');
    }
  }

  async function connect() {
    if (!provider || !username || !password) { setError('Preencha todos os campos.'); return; }
    setError('');
    setStatus('connecting');
    try {
      const d = await openFinanceApi.connect(provider, username, password);
      if (d.status !== 'logged_in' && d.status !== 'success') {
        throw new Error(d.status || 'Falha na autenticação');
      }
      const key = d.key;
      await AsyncStorage.setItem('prometeo_key', key);
      setSessionKey(key);
      await loadAccounts(key);
    } catch (e: any) {
      setError(e.message || 'Erro ao conectar.');
      setStatus('disconnected');
    }
  }

  async function disconnect() {
    try { await openFinanceApi.disconnect(sessionKey); } catch {}
    await AsyncStorage.removeItem('prometeo_key');
    setStatus('disconnected');
    setAccounts([]);
    setTransactions([]);
    setSessionKey('');
    setProvider('');
    setUsername('');
    setPassword('');
  }

  async function loadTransactions(acc: Account) {
    setSelectedAccount(acc);
    setTxLoading(true);
    try {
      const d = await openFinanceApi.transactions(sessionKey, acc.id, acc.currency || 'USD');
      setTransactions(d.transactions || []);
    } catch {}
    setTxLoading(false);
  }

  if (status === 'connecting') {
    return (
      <SafeAreaView style={[s.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.cyan} />
        <Text style={[typography.body, { marginTop: spacing.md, color: colors.textMuted }]}>
          Conectando ao banco...
        </Text>
      </SafeAreaView>
    );
  }

  if (status === 'connected') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={s.backBtn}>
            <Text style={{ color: colors.cyan, fontSize: 20 }}>←</Text>
          </TouchableOpacity>
          <Text style={s.title}>Open Finance</Text>
          <View style={s.connectedBadge}>
            <Text style={s.connectedText}>● CONECTADO</Text>
          </View>
          <TouchableOpacity onPress={disconnect} style={s.disconnectBtn}>
            <Text style={s.disconnectText}>Sair</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
          <Text style={typography.label}>CONTAS VINCULADAS</Text>
          {accounts.map(acc => (
            <TouchableOpacity key={acc.id} style={[s.accCard, selectedAccount?.id === acc.id && s.accCardActive]} onPress={() => loadTransactions(acc)}>
              <Text style={s.accName}>{acc.name || 'Conta'}</Text>
              <Text style={s.accNum}>{acc.number || acc.id.slice(0, 10)}</Text>
              <Text style={s.accBal}>{acc.balance != null ? fmt(acc.balance, acc.currency || 'USD') : '---'}</Text>
            </TouchableOpacity>
          ))}

          {selectedAccount && (
            <>
              <Text style={[typography.label, { marginTop: spacing.md }]}>
                TRANSAÇÕES — {selectedAccount.name}
              </Text>
              {txLoading
                ? <ActivityIndicator color={colors.cyan} />
                : transactions.length === 0
                  ? <Text style={s.empty}>Nenhuma transação encontrada.</Text>
                  : transactions.map((tx, i) => (
                    <View key={i} style={s.txRow}>
                      <View style={[s.txIcon, { backgroundColor: tx.debit > 0 ? colors.redDim : colors.emeraldDim }]}>
                        <Text style={{ color: tx.debit > 0 ? colors.red : colors.emerald, fontSize: 14 }} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.txDesc} numberOfLines={1}>{tx.detail}</Text>
                        <Text style={s.txDate}>{tx.date}</Text>
                      </View>
                      <Text style={[s.txAmt, { color: tx.debit > 0 ? colors.red : colors.emerald }]}>
                        {tx.debit > 0 ? '-' : '+'}{fmt(tx.debit || tx.credit, tx.currency || 'USD')}
                      </Text>
                    </View>
                  ))
              }
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Disconnected state
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={s.backBtn}>
          <Text style={{ color: colors.cyan, fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Open Finance</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        {/* Info Card */}
        <View style={s.infoCard}>
          <View style={{ height: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Text style={{ color: colors.cyan, fontSize: 20, fontWeight: '700' }}>OF</Text>
          </View>
          <Text style={[typography.h3, { textAlign: 'center', marginBottom: 4 }]}>Vincule seu banco</Text>
          <Text style={[typography.body, { textAlign: 'center' }]}>
            Conecte sua conta via Open Finance para visualizar saldos e extratos reais.
          </Text>
        </View>

        {/* Quick Test Button */}
        <TouchableOpacity
          style={s.testBtn}
          onPress={() => { setProvider('test'); setUsername('12345'); setPassword('gfdsa'); }}
        >
          <Text style={s.testBtnText}>Preencher Sandbox de Teste</Text>
        </TouchableOpacity>

        {/* Providers */}
        {providers.length > 0 && (
          <>
            <Text style={typography.label}>SELECIONE O BANCO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.lg }}>
              <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg }}>
                {providers.map(p => (
                  <TouchableOpacity
                    key={p.code}
                    onPress={() => setProvider(p.code)}
                    style={[s.provBtn, provider === p.code && s.provBtnActive]}
                  >
                    <Text style={[s.provText, provider === p.code && { color: colors.cyan }]}>{p.name}</Text>
                    <Text style={[s.provCode, provider === p.code && { color: colors.cyanBorder }]}>{p.country}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </>
        )}

        {/* Form */}
        <Text style={typography.label}>USUÁRIO DO INTERNET BANKING</Text>
        <TextInput
          style={s.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Usuário ou CPF"
          placeholderTextColor={colors.textDim}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={typography.label}>SENHA</Text>
        <TextInput
          style={s.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Senha"
          placeholderTextColor={colors.textDim}
          secureTextEntry
        />

        {error ? <Text style={s.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[s.connectBtn, (!provider || !username || !password) && { opacity: 0.4 }]}
          disabled={!provider || !username || !password}
          onPress={connect}
        >
          <Text style={s.connectBtnText}>Conectar Banco</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: 4 },
  title: { ...typography.h2, flex: 1 },
  connectedBadge: { backgroundColor: colors.emeraldDim, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.emerald },
  connectedText: { color: colors.emerald, fontSize: 9, fontWeight: '700' },
  disconnectBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.08)' },
  disconnectText: { color: colors.red, fontSize: 12, fontWeight: '600' },
  infoCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  testBtn: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)', backgroundColor: 'rgba(245,158,11,0.08)', alignItems: 'center' },
  testBtnText: { color: colors.amber, fontWeight: '700', fontSize: 14 },
  provBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', minWidth: 80 },
  provBtnActive: { borderColor: colors.cyanBorder, backgroundColor: colors.cyanDim },
  provText: { color: colors.textMuted, fontWeight: '600', fontSize: 12 },
  provCode: { color: colors.textDim, fontSize: 10, marginTop: 2 },
  input: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, color: colors.text, borderWidth: 1, borderColor: colors.border, fontSize: 15 },
  errorText: { color: colors.red, fontSize: 13, textAlign: 'center' },
  connectBtn: { backgroundColor: colors.cyan, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  connectBtnText: { color: colors.background, fontWeight: '800', fontSize: 16 },
  accCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 4 },
  accCardActive: { borderColor: colors.cyanBorder, backgroundColor: colors.cyanDim },
  accName: { ...typography.body, color: colors.text, fontWeight: '700', fontSize: 15 },
  accNum: { ...typography.caption },
  accBal: { color: colors.cyan, fontSize: 20, fontWeight: '800', marginTop: 4 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
  txIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txDesc: { ...typography.body, color: colors.text, fontWeight: '500' },
  txDate: { ...typography.caption },
  txAmt: { fontWeight: '700', fontSize: 13 },
  empty: { ...typography.body, textAlign: 'center', paddingVertical: 24, color: colors.textMuted },
});
