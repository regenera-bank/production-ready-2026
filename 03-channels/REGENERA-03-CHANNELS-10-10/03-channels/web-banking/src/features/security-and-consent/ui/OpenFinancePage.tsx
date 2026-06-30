import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/design-system/AppLayout';
import { Globe, Building, Loader2, ArrowRight, ShieldCheck, ArrowDownLeft, ArrowUpRight, Unplug } from 'lucide-react';
import { api } from '@/platform/http/client';
import { useMutation } from '@tanstack/react-query';

export const OpenFinancePage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [providers, setProviders] = useState<{ id: string; name: string }[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<any[]>([]);
  
  // Form state
  const [provider, setProvider] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Connected state
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [consentExpired, setConsentExpired] = useState(false);
  // paymentLinks state is declared at top

  useEffect(() => {
    // No client key ever. Backend (Secret Manager) resolves the Prometeo master for the authenticated user (from Firebase IdToken).
    // Try to see if already connected for this identity.
    (async () => {
      try {
        const res = await api.url('/open-finance/accounts').get().json<any>();
        if (res.accounts && res.accounts.length > 0) {
          setStatus('connected');
          setAccounts(res.accounts);
          setSelectedAccount(res.accounts[0].id);
          // inline to avoid hoisting issues
          try {
            const txRes = await api.url(`/open-finance/transactions?account=${res.accounts[0].id}&currency=${res.accounts[0].currency || 'USD'}&date_start=01/01/2025&date_end=31/12/2025`).get().json<any>();
            setTransactions(txRes.transactions || []);
          } catch {}
          loadPaymentLinks();
        } else {
          fetchProviders();
        }
      } catch {
        fetchProviders();
      }
    })();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await api.url('/open-finance/providers').get().json<any>();
      setProviders(res.providers || []);
    } catch {
      setError('Serviço temporariamente indisponível.');
      setProviders([]);
    }
  };

  // Orval-style: useMutation for connect (BFF only, Secret Manager on backend).
  const connectMutation = useMutation({
    mutationFn: async (creds: { provider: string; username: string; password: string }) => {
      return api.url('/open-finance/connect').post(creds).json<any>();
    },
    onSuccess: async () => {
      setStatus('connected');
      try {
        const accRes = await api.url('/open-finance/accounts').get().json<any>();
        if (accRes.accounts?.length) {
          setAccounts(accRes.accounts);
          setSelectedAccount(accRes.accounts[0].id);
          fetchTransactions(accRes.accounts[0].id, accRes.accounts[0].currency || 'USD');
        }
        loadPaymentLinks();
      } catch {}
    },
    onError: () => {
      setStatus('disconnected');
      setError('Serviço temporariamente indisponível.');
    }
  });

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('connecting');
    setError('');
    connectMutation.mutate({ provider, username, password });
  };

  const fetchTransactions = async (accountId: string, currency: string) => {
    try {
      const res = await api.url(`/open-finance/transactions?account=${accountId}&currency=${currency}&date_start=01/01/2025&date_end=31/12/2025`).get().json<any>();
      setTransactions(res.transactions || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisconnect = async () => {
    // Backend handles the Prometeo session teardown using its Secret Manager master. Client sends no key.
    try {
      await api.url('/open-finance/disconnect').delete();
    } catch (e) {}
    setStatus('disconnected');
    setAccounts([]);
    setTransactions([]);
    setPaymentLinks([]);
    setConsentExpired(true);
  };

  // Additional: payment links (new endpoints) - state declared at top of component

  const loadPaymentLinks = async () => {
    try {
      const res = await api.url('/open-finance/payment-links').get().json<any>();
      setPaymentLinks(res.payment_links || res || []);
    } catch {
      setError('Serviço temporariamente indisponível.');
      setPaymentLinks([]);
    }
  };

  const createPaymentLink = async () => {
    try {
      const res = await api.url('/open-finance/payment-links').post({ amount: 50, description: 'Open Finance Demo' }).json<any>();
      setPaymentLinks(p => [...p, res]);
    } catch {
      setError('Serviço temporariamente indisponível.');
    }
  };

  const fillTestData = () => {
    setProvider('test');
    setUsername('12345');
    setPassword('gfdsa');
  };

  return (
    <AppLayout activeTab="home">
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
          ←
        </button>
        <h1 className="text-sm font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" /> Open Finance
        </h1>
      </div>

      {status === 'disconnected' && (
        <div className="px-5 space-y-6">
          {consentExpired && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-4">
              <p className="text-amber-400 text-sm font-bold mb-1">Sessão Open Finance expirada</p>
              <p className="text-xs text-amber-300">Seu token de consentimento com o banco via Prometeo expirou ou é inválido. Para continuar usando a agregação de contas e evitar dados desatualizados, reconecte agora.</p>
              <button onClick={() => setConsentExpired(false)} className="mt-2 text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full border border-amber-500/30 hover:bg-amber-500/30">
                Reconectar / Re-consentir agora
              </button>
            </div>
          )}
          <div className="bg-[#0d1526] border border-white/5 rounded-[24px] p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
              <Building className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Conecte sua conta bancária</h2>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Agregue seus saldos e transações de outras instituições através do ambiente seguro Prometeo.
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold text-emerald-400 bg-emerald-500/10 py-1.5 px-3 rounded-full border border-emerald-500/20 w-fit mx-auto">
              <ShieldCheck className="w-3 h-3" /> Conexão Criptografada
            </div>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 pl-1">Instituição</label>
              <select 
                value={provider} onChange={e => setProvider(e.target.value)} required
                className="w-full bg-[#0d1526] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 appearance-none"
              >
                <option value="" disabled>Selecione um banco</option>
                {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 pl-1">Usuário / CPF</label>
              <input 
                type="text" value={username} onChange={e => setUsername(e.target.value)} required
                className="w-full bg-[#0d1526] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 pl-1">Senha</label>
              <input 
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-[#0d1526] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50" 
              />
            </div>

            <button type="submit" disabled={!provider || !username || !password || connectMutation.isPending}
              className="w-full bg-cyan-500 text-[#080d1a] rounded-xl py-3.5 font-bold uppercase tracking-widest text-xs disabled:opacity-50 mt-2 flex items-center justify-center gap-2">
              {connectMutation.isPending ? 'Conectando (BFF + Secret Manager)...' : 'Conectar Banco'} <ArrowRight className="w-4 h-4" />
            </button>
            
            <button type="button" onClick={fillTestData}
              className="w-full text-center text-[10px] text-gray-500 underline underline-offset-4 uppercase tracking-widest mt-2">
              Preencher dados de Teste (Prometeo)
            </button>
          </form>
        </div>
      )}

      {status === 'connecting' && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-5">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-6" />
          <h3 className="text-white font-bold text-lg mb-2">Conectando ao banco...</h3>
          <p className="text-gray-500 text-xs text-center">Estabelecendo túnel seguro via BFF (Secret Manager no backend).</p>
        </div>
      )}

      {status === 'connected' && (
        <div className="px-5 pb-20">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Contas Sincronizadas</p>
            <button onClick={handleDisconnect} className="text-[9px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Unplug className="w-3 h-3" /> Desconectar
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4">
            {/* Payment links demo */}
            {paymentLinks.length > 0 && (
              <div className="mt-4 p-3 bg-white/5 rounded-xl text-xs">
                <div className="flex justify-between mb-2">
                  <span className="font-bold">Payment Links</span>
                  <button onClick={createPaymentLink} className="text-cyan-400">+ Create Demo</button>
                </div>
                {paymentLinks.slice(0,3).map((l, i) => <div key={i}>{l.id} - R$ {l.amount} {l.status}</div>)}
              </div>
            )}
            {accounts.map(acc => (
              <button 
                key={acc.id}
                onClick={() => {
                  setSelectedAccount(acc.id);
                  fetchTransactions(acc.id, acc.currency);
                }}
                className={`flex-shrink-0 w-64 bg-[#0d1526] rounded-2xl p-5 border text-left transition-all ${selectedAccount === acc.id ? 'border-cyan-500 shadow-[0_0_15px_rgba(0,240,255,0.15)]' : 'border-white/5 opacity-70'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 bg-cyan-500/10 rounded-full flex items-center justify-center border border-cyan-500/20">
                    <Building className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-[10px] text-gray-500 uppercase font-mono">{acc.number}</span>
                </div>
                <p className="text-xs text-gray-400 font-bold mb-1">{acc.name}</p>
                <p className="text-2xl font-light text-white tracking-tight">
                  <span className="text-sm text-gray-500 mr-1">{acc.currency === 'BRL' ? 'R$' : acc.currency}</span>
                  {acc.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </button>
            ))}
          </div>

          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-4 mb-3">Transações Recentes</p>
          
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 text-gray-600 animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-500">Sincronizando extrato...</p>
              </div>
            ) : (
              transactions.map(tx => {
                const isCredit = tx.credit > 0;
                const amount = isCredit ? tx.credit : tx.debit;
                
                return (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-[#0d1526] border border-white/5 rounded-[18px]">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isCredit ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                        {isCredit ? <ArrowDownLeft className="w-4 h-4 text-emerald-400" /> : <ArrowUpRight className="w-4 h-4 text-red-400" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white truncate max-w-[160px]">{tx.detail || tx.description}</p>
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">{tx.date}</p>
                      </div>
                    </div>
                    <span className={`font-bold text-sm ${isCredit ? 'text-emerald-400' : 'text-white'}`}>
                      {isCredit ? '+' : '-'} {tx.currency === 'BRL' ? 'R$' : tx.currency} {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
};
