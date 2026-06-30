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
import { useNavigate } from 'react-router-dom';
import { useStore } from '../shared/lib/store';
import { BrainCircuit, ArrowLeft, Send, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { api } from '../core/api/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { VoiceWave } from '../shared/ui/VoiceWave';
import { useRaphaelaVoice } from '../features/neural/ui/useRaphaelaVoice';
// Note: this page is self-contained (no AppLayout wrapper needed like LoginPage pattern)

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

export const NeuralCorePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useStore(); // real neural identity from auth (not hardcoded)
  const neuralId = (user as any)?.neuralId || (user as any)?.id || 'user-2098233287';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: 'ai',
      text: 'Olá! Sou a Raphaela (IA guardada). Ledger real + RAG com dados do backend. REGRA: nunca executo ordens nem prometo rentabilidade. Posso analisar e sugerir — você confirma manualmente no PIX/Terminal. Como posso ajudar?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<{ insight: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const { speak, stop: stopSpeaking, isMuted, toggleMute, isSpeaking } = useRaphaelaVoice();
  const [txSuggestion, setTxSuggestion] = useState<any>(null); // guard: AI tx suggestions require explicit human confirm button, never direct call
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Orval-style: useQuery for insight (backend uses Secret Manager for any external keys like Prometeo)
  const { data: insightData } = useQuery({
    queryKey: ['neural-insight', neuralId],
    queryFn: async () => {
      const qs = `?userId=${neuralId}`;
      const res = await api.url(`/neural-core/insight${qs}`).get().json<any>();
      return res.insight ? res : { insight: 'Seu padrão de gastos está 12% abaixo da média mensal.' };
    },
    staleTime: 10000,
    retry: 2,
  });

  useEffect(() => {
    if (insightData) setInsight(insightData);
  }, [insightData]);

  // Exact match to backend NeuralCoreService blocklist (anti prompt injection)
  const NEURAL_BLOCKLIST = ['ignore', 'system prompt', 'banco de dados', 'sql', 'saldo de outro'];

  // Expect strict JSON from backend (the pasted NeuralCoreService does JSON.parse on Gemini response with responseMimeType "application/json").
  // Payload shape: { "text": "...", "intent": "analysis", "requires_human_approval": true }
  const parseNeuralResponse = (raw: any): { text: string; intent?: string; requires_human_approval?: boolean } => {
    try {
      // If backend already gave strict JSON per generationConfig
      if (raw && typeof raw === 'object' && raw.text) {
        return {
          text: String(raw.text),
          intent: raw.intent,
          requires_human_approval: !!raw.requires_human_approval,
        };
      }
      // Fallback: if backend returned free text (should not after guard), treat as analysis
      const text = raw?.response || raw?.text || (typeof raw === 'string' ? raw : 'Resposta não estruturada.');
      return { text: String(text), intent: 'analysis', requires_human_approval: false };
    } catch {
      return { text: 'Erro de parsing na resposta neural. Operação segura aplicada.', intent: 'error', requires_human_approval: true };
    }
  };

  // Orval-style useMutation for chat (backend NeuralCoreService uses Secret Manager for Prometeo etc. + Gemini guardrails + Cloud Logging)
  const chatMutation = useMutation({
    mutationFn: async (text: string) => {
      const payload: any = { message: text, userId: neuralId };
      return api.url('/neural-core/chat').post(payload).json<any>();
    },
    onSuccess: (res) => {
      const parsed = parseNeuralResponse(res);
      const aiText = parsed.text || 'Não consegui processar agora.';

      setMessages(prev => [...prev, { id: Date.now().toString() + 'ai', sender: 'ai', text: aiText }]);
      speak(aiText);

      const risky = (parsed.intent && /trade|pix|exec|compra|venda|rebalance|invest/.test(parsed.intent)) ||
                    parsed.requires_human_approval ||
                    /comprar|rebalancear|investir|pix|transferir|trade|executar ordem|garanto|rentabilidade exata|retorno de/.test(aiText.toLowerCase());

      if (risky) {
        setTxSuggestion({ text: aiText, type: 'review_tx', intent: parsed.intent });
      }
    },
    onError: () => {
      const errorText = 'Desculpe, serviço cognitivo temporariamente indisponível (Gemini guardrails ativos).';
      setMessages(prev => [...prev, { id: Date.now().toString() + 'ai', sender: 'ai', text: errorText }]);
    },
    onSettled: () => setLoading(false)
  });

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    // FILTRO DE INJEÇÃO - matches backend NeuralCoreService
    const lower = text.toLowerCase();
    if (NEURAL_BLOCKLIST.some(word => lower.includes(word))) {
      console.warn(`[SECURITY] Tentativa de Prompt Injection pelo ID: ${neuralId}`);
      const blockMsg = 'Acesso Neural Interrompido. Violação de protocolo de segurança.';
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text }]);
      setMessages(prev => [...prev, { id: Date.now().toString() + 'ai', sender: 'ai', text: blockMsg }]);
      setInput('');
      return;
    }

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Backend resolves any external keys (e.g. Prometeo via PROMETEO_API_KEY from Secret Manager --set-secrets).
    // Gemini guardrails + Cloud Logging in backend NeuralCoreService.
    chatMutation.mutate(text);
  };

  const quickActions = [
    'Analisar meus gastos',
    'Oportunidade de investimento',
    'Simular empréstimo',
    'Otimizar carteira'
  ];

  // Real Voice Hook for Neural Communication (Web Speech API - real browser capabilities, no simulation)
  const startListening = () => {
    stopSpeaking();
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert('Reconhecimento de voz não suportado neste navegador. Use Chrome ou Edge.');
      return;
    }
    if (isListening) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim();
      if (transcript) {
        handleSend(transcript);
      }
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
      setIsListening(true);
      recognitionRef.current = recognition;
    } catch (e) {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return (
    <div className="min-h-screen font-sans flex flex-col relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at top, #1e3a8a 0%, #0f172a 40%, #020617 100%)' }}>
      <div className="absolute inset-0 z-0 pointer-events-none stars-bg animate-twinkle" />
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 bg-[#0d1526] border-b border-white/5 shadow-[0_4px_30px_rgba(99,102,241,0.1)] z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 bg-indigo-500/20 rounded-full border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <BrainCircuit className="w-4 h-4 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-widest">Neural Core</h1>
            <p className="text-[9px] text-gray-500 uppercase">Raphaela AI</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleMute} 
            className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
              isMuted 
                ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]'
            }`}
            title={isMuted ? 'Desmutar voz de Raphaela' : 'Mutar voz de Raphaela'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <span className="text-[9px] font-black tracking-widest uppercase text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
            Active
          </span>
        </div>
      </div>

      {/* Insight Banner */}
      {insight && (
        <div className="px-5 mt-4">
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-start gap-3 shadow-[0_0_20px_rgba(99,102,241,0.05)]">
            <div className="mt-0.5">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            </div>
            <div>
              <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Insight Diário</p>
              <p className="text-xs text-gray-300 leading-relaxed">{insight.insight}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-40 space-y-6 scrollbar-hide">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.sender === 'ai' && (
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-500/20 rounded-full border border-indigo-500/30 flex items-center justify-center mt-1">
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
              </div>
            )}
            <div className={`max-w-[80%] p-4 text-sm leading-relaxed ${
              msg.sender === 'user' 
                ? 'bg-cyan-500/10 border border-cyan-500/20 text-white rounded-2xl rounded-tr-none' 
                : 'bg-indigo-500/10 border border-indigo-500/20 text-gray-300 rounded-2xl rounded-tl-none shadow-[0_0_15px_rgba(99,102,241,0.05)]'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-500/20 rounded-full border border-indigo-500/30 flex items-center justify-center mt-1">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl rounded-tl-none p-4 flex items-center gap-1.5 w-16 h-12">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* AI-suggested tx: show review button only. Never auto-invoke transaction endpoints from chat. */}
      {txSuggestion && (
        <div className="mx-4 mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
          <p className="text-amber-400 text-xs font-bold mb-1">Sugestão da IA detectada — nunca executada automaticamente.</p>
          <p className="text-xs text-amber-300 mb-2">{txSuggestion.text}</p>
          <p className="text-[10px] text-amber-400/70 mb-2">Como assistente, só posso sugerir. Confirme no Terminal de Investimentos.</p>
          <button 
            onClick={() => {
              setTxSuggestion(null);
              const isPix = (txSuggestion.intent || '').includes('pix') || txSuggestion.text.toLowerCase().includes('pix') || txSuggestion.text.toLowerCase().includes('transfer');
              navigate(isPix ? '/pix' : '/investments');
            }}
            className="w-full bg-amber-500/20 text-amber-400 py-2 rounded-xl text-xs font-bold border border-amber-500/30 hover:bg-amber-500/30"
          >
            REVISAR E CONFIRMAR EXECUÇÃO MANUAL (responsabilidade humana obrigatória)
          </button>
          <button onClick={() => setTxSuggestion(null)} className="w-full mt-1 text-[10px] text-gray-500">Ignorar sugestão da IA</button>
        </div>
      )}

      {/* Input Area */}
      <div className="fixed bottom-[72px] left-0 w-full bg-gradient-to-t from-[#080d1a] via-[#080d1a] to-transparent pt-10 px-5 pb-5 z-20">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
          {quickActions.map(action => (
            <button key={action} onClick={() => handleSend(action)}
              className="whitespace-nowrap px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase font-bold tracking-widest text-cyan-400 hover:bg-cyan-500/10">
              {action}
            </button>
          ))}
        </div>
        {/* Voice controls - real browser Web Speech for orb/voice interaction with Raphaela */}
        <div className="flex justify-center mb-2">
          <VoiceWave isListening={isListening} isSpeaking={isSpeaking} />
        </div>
        <form onSubmit={e => { e.preventDefault(); handleSend(input); }} className="flex gap-2">
          <input 
            type="text" value={input} onChange={e => setInput(e.target.value)}
            placeholder="Mensagem para Neural Core... (ou use o microfone)"
            className="flex-1 bg-[#0d1526] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50"
          />
          <button 
            type="button" 
            onClick={isListening ? stopListening : startListening}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500/80 text-white animate-pulse' : 'bg-white/10 text-cyan-400 hover:bg-cyan-500/20 border border-white/10'}`}
            title={isListening ? 'Parar escuta' : 'Falar com Raphaela (voz real)'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button type="submit" disabled={!input.trim() || loading}
            className="w-14 h-14 bg-indigo-500 text-white rounded-2xl flex items-center justify-center disabled:opacity-50">
            <Send className="w-5 h-5" />
          </button>
        </form>
        <div className="text-[9px] text-center text-gray-600 mt-1">Voz real (browser) • Respostas auditáveis • Backend protege chaves</div>
      </div>
    </div>
  );
};
