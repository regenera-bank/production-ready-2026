import React, { useState } from 'react';
import { 
  Cloud, Cpu, Play, Square, Plus, Trash2, Key, RefreshCw, 
  Award, CheckSquare, Square as SquareIcon, Star, PlayCircle, Trophy,
  ShieldAlert, ShieldCheck, Heart, Sparkles, Activity, Anchor, HelpCircle,
  AlertTriangle, DollarSign, ArrowRight, Calendar, MapPin, Ticket,
  Zap, Flame, Compass, Leaf, Calculator, BookOpen, GraduationCap,
  Download, Search, Globe, ChevronRight, Copy
} from 'lucide-react';

// --- MOCK NOTIFICATION SYSTEM ---
interface FeedbackHelper {
  showFeedback: (msg: string, type?: 'success' | 'alert' | 'security') => void;
  speak: (txt: string) => void;
}

// --------------------------------------------------------------------------
// 1. REGENERA CLOUD
// --------------------------------------------------------------------------
export const RegeneraCloud: React.FC<FeedbackHelper> = ({ showFeedback, speak }) => {
  const [activeTab, setActiveTab] = useState<'compute' | 'storage' | 'secret'>('compute');
  const [instances, setInstances] = useState([
    { id: '1', name: 'regenera-core-v1', type: 'e2-standard-4', zone: 'us-central1-a', ip: '34.12.98.11', status: 'RUNNING' },
    { id: '2', name: 'raphaela-brain-training', type: 'a2-highgpu-1g', zone: 'us-central1-b', ip: '35.101.44.82', status: 'RUNNING' }
  ]);

  const toggleStatus = (id: string) => {
    setInstances(prev => prev.map(inst => {
      if (inst.id === id) {
        const nextStatus = inst.status === 'RUNNING' ? 'STOPPING' : 'RUNNING';
        showFeedback(`Instância ${inst.name} -> ${nextStatus}`, nextStatus === 'STOPPING' ? 'alert' : 'success');
        speak(`Modificando status da instância ${inst.name} para ${nextStatus}.`);
        return { ...inst, status: nextStatus };
      }
      return inst;
    }));
  };

  const createInstance = () => {
    const newId = (instances.length + 1).toString();
    const names = ['api-gateway-secure', 'quantum-ledger-db', 'neural-router-v4'];
    const newName = names[instances.length % names.length];
    setInstances(prev => [...prev, {
      id: newId,
      name: newName,
      type: 'e2-medium',
      zone: 'us-central1-c',
      ip: `104.198.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      status: 'RUNNING'
    }]);
    showFeedback(`Instância ${newName} provisionada.`, 'success');
    speak(`Nova máquina virtual ${newName} inicializada com sucesso.`);
  };

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right duration-500 pb-32">
      <div className="luminous-card p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/20 rounded-xl">
            <Cloud className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Regenera Cloud Console</h2>
            <p className="text-xs text-cyan-400 tracking-wider font-mono">Quantum Stack Compute Engine v4</p>
          </div>
        </div>
      </div>

      <div className="tabs flex gap-2 p-1 bg-black/40 border border-white/5 rounded-xl">
        <button 
          onClick={() => setActiveTab('compute')} 
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'compute' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-400 hover:text-white'}`}
        >
          Compute Instances
        </button>
        <button 
          onClick={() => setActiveTab('storage')} 
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'storage' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-400 hover:text-white'}`}
        >
          Cloud Storage
        </button>
        <button 
          onClick={() => setActiveTab('secret')} 
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'secret' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-400 hover:text-white'}`}
        >
          Secret Manager
        </button>
      </div>

      {activeTab === 'compute' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Máquinas Virtuais ({instances.length})</span>
            <button onClick={createInstance} className="btn-primary flex items-center gap-1.5 py-1 px-3 rounded-lg text-xs font-bold">
              <Plus className="w-3.5 h-3.5" /> Provisionar VM
            </button>
          </div>

          <div className="space-y-3">
            {instances.map(inst => (
              <div key={inst.id} className="luminous-card p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-950/40 rounded-xl border border-cyan-500/20">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{inst.name}</h4>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">{inst.zone} • {inst.type} • {inst.ip}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full ${inst.status === 'RUNNING' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'}`}>
                    {inst.status}
                  </span>
                  <button 
                    onClick={() => toggleStatus(inst.id)} 
                    className="p-1.5 rounded-lg border border-white/10 hover:border-red-500/30 hover:bg-red-500/15 text-gray-400 hover:text-red-400 transition-all"
                  >
                    {inst.status === 'RUNNING' ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'storage' && (
        <div className="luminous-card p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto">
            <Cloud className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Google Cloud Storage</h3>
            <p className="text-xs text-gray-400 mt-1">Conectado a buckets corporativos criptografados.</p>
          </div>
          <div className="bg-black/20 p-4 rounded-xl font-mono text-[10px] text-gray-500 text-left leading-relaxed">
            gs://regenera-private-backup-don-paulo-8492/<br/>
            - invoice_2026_jun.pdf (245 KB)<br/>
            - financial_neural_weights_latest.bin (4.1 GB)
          </div>
        </div>
      )}

      {activeTab === 'secret' && (
        <div className="luminous-card p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto">
            <Key className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Quantum Secret Manager</h3>
            <p className="text-xs text-gray-400 mt-1">Chaves e credenciais criptografadas via hardware.</p>
          </div>
          <div className="bg-black/20 p-4 rounded-xl font-mono text-[10px] text-gray-500 text-left space-y-2">
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-purple-300">GEMINI_API_KEY</span>
              <span>•••••••••••••••••••••</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-purple-300">TELEGRAM_BOT_TOKEN</span>
              <span>•••••••••••••••••••••</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-300">GOOGLE_CLOUD_TOKEN</span>
              <span>•••••••••••••••••••••</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --------------------------------------------------------------------------
// 2. CONTA KIDS
// --------------------------------------------------------------------------
export const ContaKids: React.FC<FeedbackHelper> = ({ showFeedback, speak }) => {
  const [xp, setXp] = useState(850);
  const [level, setLevel] = useState(12);
  const [mesada, setMesada] = useState(120.50);
  const [missions, setMissions] = useState([
    { id: '1', name: 'Arrumar o Quarto', xp: 50, reward: 5.00, done: true },
    { id: '2', name: 'Ler 10 Páginas', xp: 100, reward: 10.00, done: false },
    { id: '3', name: 'Dever de Casa de Finanças', xp: 200, reward: 15.00, done: false }
  ]);

  const toggleMission = (id: string) => {
    setMissions(prev => prev.map(m => {
      if (m.id === id) {
        const nextDone = !m.done;
        if (nextDone) {
          setXp(x => x + m.xp);
          setMesada(b => b + m.reward);
          showFeedback(`Missão Concluída! +${m.xp} XP e +R$ ${m.reward.toFixed(2)} mesada!`, 'success');
          speak(`Parabéns! Missão ${m.name} concluída. Você subiu seu saldo.`);
          if (xp + m.xp >= level * 100) {
            setLevel(l => l + 1);
            showFeedback(`UAU! Você subiu para o Nível ${level + 1}!`, 'success');
            speak(`Excelente! Você acaba de subir de nível para o nível ${level + 1}. Continue estudando.`);
          }
        } else {
          setXp(x => x - m.xp);
          setMesada(b => b - m.reward);
        }
        return { ...m, done: nextDone };
      }
      return m;
    }));
  };

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right duration-500 pb-32">
      {/* Kids Profile Header */}
      <div className="luminous-card p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center font-bold text-white text-3xl shadow-lg border-2 border-white/10 shadow-amber-500/20">
          L
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-white">Lucas</h3>
            <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/30">Nível {level}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{xp} XP Acumulado</p>
          <div className="xp-bar mt-2">
            <div className="xp-fill bg-amber-400" style={{ width: `${(xp % 100)}%` }}></div>
          </div>
        </div>
      </div>

      <div className="luminous-card p-5 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Minha Mesada Digital</p>
        <h2 className="text-3xl font-bold text-white mt-1">R$ {mesada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Missões Diárias</h3>
        {missions.map(m => (
          <div 
            key={m.id} 
            onClick={() => toggleMission(m.id)}
            className="luminous-card p-4 flex items-center gap-4 cursor-pointer hover:border-amber-400/30 transition-all select-none"
          >
            <div className={`w-6 h-6 rounded-full border border-white/20 flex items-center justify-center transition-all ${m.done ? 'bg-amber-400 border-amber-400 text-black' : 'bg-white/5'}`}>
              {m.done && <Award className="w-3.5 h-3.5" />}
            </div>
            <div className="flex-1">
              <h4 className={`text-sm font-bold ${m.done ? 'text-gray-500 line-through' : 'text-white'}`}>{m.name}</h4>
              <p className="text-[10px] text-gray-500 font-mono mt-0.5">+R$ {m.reward.toFixed(2)} mesada</p>
            </div>
            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
              +{m.xp} XP
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="luminous-card p-5 flex flex-col justify-between" style={{ background: 'linear-gradient(135deg, #241452, #0d082c)' }}>
          <div>
            <h4 className="font-bold text-white text-base">Quiz Educativo</h4>
            <p className="text-xs text-purple-300 mt-1">Aprenda brincando e ganhe XP.</p>
          </div>
          <button onClick={() => { showFeedback("Preparando Quiz Diário...", "success"); speak("Iniciando quiz de planejamento infantil."); }} className="btn-primary mt-4 py-2 w-full text-xs font-bold uppercase tracking-wider rounded-lg">
            Jogar
          </button>
        </div>

        <div className="luminous-card p-5 flex flex-col justify-between" style={{ background: 'linear-gradient(135deg, #0d385c, #03142d)' }}>
          <div>
            <h4 className="font-bold text-white text-base">Aulas Rápidas</h4>
            <p className="text-xs text-cyan-300 mt-1">O que são juros? Como investir?</p>
          </div>
          <button onClick={() => { showFeedback("Acessando canais educativos...", "success"); speak("Carregando vídeos educativos sobre poupança."); }} className="btn-ghost mt-4 py-2 w-full text-xs font-bold uppercase tracking-wider rounded-lg border border-cyan-500/20">
            Aprender
          </button>
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------
// 3. CONTA SENIOR
// --------------------------------------------------------------------------
export const ContaSenior: React.FC<FeedbackHelper> = ({ showFeedback, speak }) => {
  const [siteUrl, setSiteUrl] = useState('');
  const [scanResult, setScanResult] = useState<'none' | 'secure' | 'danger'>('none');
  const [isScanning, setIsScanning] = useState(false);
  const [bills, setBills] = useState([
    { id: '1', name: 'Conta de Energia Elétrica', due: 'Amanhã', amount: 180.00, urgent: true, paid: false },
    { id: '2', name: 'Mensalidade Plano de Saúde', due: 'Vence em 5 dias', amount: 1200.00, urgent: false, paid: false }
  ]);

  const verifySite = () => {
    if (!siteUrl.trim()) {
      showFeedback("Insira um endereço de website.", "alert");
      return;
    }
    setIsScanning(true);
    setScanResult('none');
    speak(`Iniciando varredura heurística de segurança no site ${siteUrl}.`);
    
    setTimeout(() => {
      setIsScanning(false);
      const lower = siteUrl.toLowerCase();
      if (lower.includes('banco') || lower.includes('recarga') || lower.includes('gratis') || lower.includes('promocao') || lower.includes('.xyz') || lower.includes('.cc')) {
        setScanResult('danger');
        showFeedback("ALERTA: Website Suspeito Detectado!", "security");
        speak(`Atenção, Don Paulo. O site analisado possui padrões de phishing e fraude. Recomendamos fechar a guia.`);
      } else {
        setScanResult('secure');
        showFeedback("Site Seguro verificado pela Raphaela.", "success");
        speak(`O site está verificado e certificado. Conexão criptografada ativa.`);
      }
    }, 2000);
  };

  const payBill = (id: string, name: string, amount: number) => {
    setBills(prev => prev.map(bill => {
      if (bill.id === id) {
        showFeedback(`Conta "${name}" de R$ ${amount.toFixed(2)} paga com sucesso!`, 'success');
        speak(`Sua conta de ${name} foi liquidada do seu saldo global.`);
        return { ...bill, paid: true };
      }
      return bill;
    }));
  };

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right duration-500 pb-32">
      <div className="luminous-card p-5" style={{ background: 'linear-gradient(135deg, #092e20, #03140f)', borderColor: 'rgba(74, 252, 214, 0.3)' }}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-xl">
            <Heart className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Regenera Sênior</h3>
            <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mt-0.5">Sua segurança é nossa prioridade máxima.</p>
          </div>
        </div>
      </div>

      {/* site verifier */}
      <div className="luminous-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          <h4 className="font-bold text-sm text-white">Verificador de Links e Websites</h4>
        </div>
        <p className="text-xs text-gray-400">Recebeu uma mensagem estranha? Cole o link abaixo para verificarmos se o site é falso ou perigoso.</p>
        
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Ex: www.recargafacil-banco.cc" 
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            className="input-field flex-1 text-xs px-3"
          />
          <button onClick={verifySite} disabled={isScanning} className="btn-primary text-xs px-4 py-2 font-bold shrink-0">
            {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verificar'}
          </button>
        </div>

        {scanResult === 'secure' && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-3 animate-in zoom-in">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
            <div>
              <span className="text-xs font-bold text-emerald-400">SÍTIO CONFIÁVEL E SEGURO</span>
              <p className="text-[10px] text-gray-400 mt-0.5">A Raphaela analisou e certificou que este domínio é idôneo e seguro para navegação.</p>
            </div>
          </div>
        )}

        {scanResult === 'danger' && (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 animate-in shake">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
            <div>
              <span className="text-xs font-bold text-red-400">ALERTA: POTENCIAL AMEAÇA DETECTADA</span>
              <p className="text-[10px] text-gray-400 mt-0.5">Cuidado! Domínio suspeito com indícios de roubo de senhas (Phishing). Não insira seus dados.</p>
            </div>
          </div>
        )}
      </div>

      {/* bills and utilities list */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Suas Contas de Serviços</h3>
        {bills.map(bill => (
          <div key={bill.id} className="luminous-card p-4 flex justify-between items-center">
            <div className="flex-1 pr-4">
              <h4 className={`text-sm font-bold ${bill.paid ? 'text-gray-500 line-through' : 'text-white'}`}>{bill.name}</h4>
              <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${bill.paid ? 'text-emerald-400' : bill.urgent ? 'text-amber-400' : 'text-gray-400'}`}>
                {bill.paid ? 'PAGA' : bill.due}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-bold font-mono text-white">R$ {bill.amount.toFixed(2)}</span>
              {!bill.paid ? (
                <button 
                  onClick={() => payBill(bill.id, bill.name, bill.amount)} 
                  className="btn-primary text-[10px] py-1 px-3 rounded-lg font-bold uppercase shrink-0"
                >
                  Pagar
                </button>
              ) : (
                <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">Pago</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Emergency SOS button */}
      <button 
        onClick={() => { 
          showFeedback("Canal de Emergência Ativado. Conectando com Assistência Médica e Humana...", "security"); 
          speak("Alerta SOS acionado. Don Paulo, estamos entrando em contato com seu contato de emergência e com a central de suporte."); 
        }} 
        className="sos-btn w-full py-4 flex items-center justify-center gap-2"
      >
        <Flame className="w-5 h-5 animate-pulse" />
        AJUDA / SOS DE EMERGÊNCIA
      </button>
    </div>
  );
};

// --------------------------------------------------------------------------
// 4. CONTA PET
// --------------------------------------------------------------------------
export const ContaPet: React.FC<FeedbackHelper> = ({ showFeedback, speak }) => {
  const [savings, setSavings] = useState(6250.00);
  const [scheduledService, setScheduledService] = useState<string | null>(null);

  const toggleService = (srv: string) => {
    if (scheduledService === srv) {
      setScheduledService(null);
      showFeedback(`Cancelado agendamento de ${srv}`, 'alert');
    } else {
      setScheduledService(srv);
      showFeedback(`Agendado ${srv} com sucesso na Vila Pet!`, 'success');
      speak(`Seu agendamento para ${srv} do Morpheus foi gravado na clínica veterinária parceira.`);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right duration-500 pb-32">
      <div className="pet-header text-center p-6 bg-gradient-to-br from-indigo-950/40 to-bg-mid border border-white/10 rounded-[2rem]">
        <div className="w-20 h-20 rounded-full border-4 border-amber-400 bg-bg-mid mx-auto mb-3 flex items-center justify-center text-4xl shadow-lg">
          🐱
        </div>
        <h3 className="font-bold text-2xl text-white">Morpheus</h3>
        <p className="text-xs text-gray-400 mt-1">Gato Persa • Nasc. 01/09/2025</p>

        <div className="luminous-card p-4 mt-6 text-left">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Poupança do Morpheus</p>
          <div className="flex justify-between items-end mt-1">
            <span className="text-2xl font-bold text-white">R$ {savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            <button onClick={() => { setSavings(s => s + 50); showFeedback("Depositado R$ 50,00 na poupança pet!", "success"); }} className="btn-primary py-1 px-3 text-[10px] font-bold uppercase rounded-lg">
              Guardar +
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { name: 'Seguro Pet', sub: 'Premium Ativo', icon: ShieldCheck, srvId: 'seguro' },
          { name: 'Vila Pet', sub: 'Agendar Banho', icon: Heart, srvId: 'banho' },
          { name: 'Saúde & Vacinas', sub: 'Morpheus em dia', icon: Activity, srvId: 'vacinas' },
          { name: 'Clubinho Pet', sub: 'Assinaturas', icon: Trophy, srvId: 'club' }
        ].map((serv, idx) => {
          const isSelected = scheduledService === serv.name;
          return (
            <div 
              key={idx} 
              onClick={() => toggleService(serv.name)}
              className={`luminous-card p-5 cursor-pointer flex flex-col justify-between h-36 hover:border-cyan-400/40 transition-all ${isSelected ? 'border-cyan-400' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-white/5 rounded-xl text-cyan-400">
                  <serv.icon className="w-5 h-5" />
                </div>
                {isSelected && <span className="bg-cyan-500/10 text-cyan-400 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">AGENDADO</span>}
              </div>
              <div>
                <h4 className="font-bold text-white text-sm mt-3">{serv.name}</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">{serv.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------
// 5. SUSTENTABILIDADE
// --------------------------------------------------------------------------
export const Sustentabilidade: React.FC<FeedbackHelper> = ({ showFeedback, speak }) => {
  const [energy, setEnergy] = useState(700);
  const [transport, setTransport] = useState(2000);

  // Carbon math formula mimicking vanilla prototype
  const carbonEstimate = (energy * 0.005 + transport * 0.12).toFixed(2);

  const compensateCarbon = () => {
    showFeedback("Pegada de Carbono compensada com sucesso! +100 Regenera Points sustentáveis.", "success");
    speak(`Compensação executada com sucesso. Neutralizamos ${carbonEstimate} toneladas de carbono via reflorestamento parceiro na Amazônia.`);
  };

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right duration-500 pb-32">
      <div className="luminous-card p-6 text-center space-y-4" style={{ background: 'linear-gradient(145deg, #021a0f, #00040c)', borderColor: 'rgba(47, 203, 150, 0.3)' }}>
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <Leaf className="w-8 h-8 text-emerald-400 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-emerald-400">Compensação Carbono Zero</h2>
          <p className="text-xs text-gray-400 mt-1">Nivele o seu impacto ambiental corporativo ou familiar.</p>
        </div>
      </div>

      <div className="luminous-card p-5 space-y-6">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <Calculator className="w-5 h-5 text-emerald-400" />
          <h4 className="font-bold text-sm text-white">Calculadora Dinâmica de Emissões</h4>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Consumo de Energia Elétrica</span>
              <span className="font-bold text-white">R$ {energy} /mês</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="2000" 
              value={energy} 
              onChange={(e) => setEnergy(parseInt(e.target.value))}
              className="w-full h-1.5 bg-black/40 rounded-full outline-none accent-emerald-400"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Transporte Rodoviário ou Aéreo</span>
              <span className="font-bold text-white">{transport} km /mês</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="5000" 
              value={transport} 
              onChange={(e) => setTransport(parseInt(e.target.value))}
              className="w-full h-1.5 bg-black/40 rounded-full outline-none accent-emerald-400"
            />
          </div>
        </div>

        <div className="bg-black/30 border border-white/5 p-4 rounded-2xl text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Pegada de Carbono Estimada</p>
          <h3 className="text-3xl font-bold text-emerald-400 mt-1">{carbonEstimate} Ton <span className="text-sm font-medium text-gray-500 font-mono">CO2e</span></h3>
        </div>

        <button onClick={compensateCarbon} className="compensar-btn w-full py-4 text-xs font-bold uppercase tracking-widest">
          Compensar Pegada Agora
        </button>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------
// 6. EDUCAÇÃO FINANCEIRA
// --------------------------------------------------------------------------
export const EducacaoFinanceira: React.FC<FeedbackHelper> = ({ showFeedback, speak }) => {
  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right duration-500 pb-32">
      <div className="academy-header p-6 flex items-center gap-4">
        <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
          <GraduationCap className="w-8 h-8 text-cyan-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white">Regenera Academy</h2>
          <p className="text-[10px] text-cyan-300 uppercase tracking-widest font-bold">Programa de Educação de Alta Renda</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 progress-bar-wrap">
              <div className="progress-fill" style={{ width: '65%' }}></div>
            </div>
            <span className="text-xs font-bold text-cyan-400">65%</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Aulas do Módulo Executivo</h3>

        {[
          { title: 'Dominando Investimentos Internacionais', duration: '12 Aulas', completed: '80%', color: 'border-emerald-500/30 text-emerald-400' },
          { title: 'Criptoeconomia & DeFi Avançado', duration: '8 Aulas', completed: '30%', color: 'border-cyan-500/30 text-cyan-400' },
          { title: 'Planejamento Sucessório Offshore', duration: '5 Aulas', completed: 'Pendente', color: 'border-white/10 text-gray-400' },
        ].map((course, i) => (
          <div key={i} className="luminous-card p-4 flex justify-between items-center group cursor-pointer hover:border-cyan-500/30 transition-all">
            <div className="flex items-center gap-3">
              <div className="course-play p-2 bg-white/5 rounded-full text-cyan-400 group-hover:bg-cyan-500/10">
                <PlayCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-cyan-200">{course.title}</h4>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">{course.duration}</p>
              </div>
            </div>

            <span className={`text-xs font-bold border px-2.5 py-1 rounded-full ${course.color}`}>
              {course.completed}
            </span>
          </div>
        ))}
      </div>

      <div className="luminous-card p-5" style={{ background: 'linear-gradient(135deg, #161e70, #03082e)' }}>
        <h4 className="font-bold text-white text-base">Quiz Diário de Mercado</h4>
        <p className="text-xs text-gray-300 mt-1">Responda ao quiz de finanças diário para acumular pontos extras no Regenera Rewards.</p>
        <button onClick={() => { showFeedback("Preparando questionário diário...", "success"); speak("Iniciando o questionário de educação corporativa."); }} className="btn-primary w-full py-3 mt-4 text-xs font-bold uppercase tracking-wider rounded-lg">
          Responder Agora
        </button>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------
// 7. ANALYTICS PYTHON
// --------------------------------------------------------------------------
export const AnalyticsPython: React.FC<FeedbackHelper> = ({ showFeedback, speak }) => {
  const [desc, setDesc] = useState('Restaurante Savor');
  const [amount, setAmount] = useState('320.00');
  const [category, setCategory] = useState<'none' | 'LIFESTYLE' | 'TRANSPORT' | 'ESSENTIAL' | 'INVESTMENT' | 'TRANSFER'>('none');
  const [carbonResult, setCarbonResult] = useState<string | null>(null);

  const runPythonSimulation = () => {
    const val = parseFloat(amount);
    if (!desc.trim() || isNaN(val) || val <= 0) {
      showFeedback("Insira descrição e valor numérico válido.", "alert");
      return;
    }

    const lower = desc.toLowerCase();
    let cat: typeof category = 'ESSENTIAL';
    let carbonFactor = 0;

    if (lower.includes('uber') || lower.includes('posto') || lower.includes('viagem') || lower.includes('gasolina')) {
      cat = 'TRANSPORT';
      carbonFactor = 0.085;
    } else if (lower.includes('restaurante') || lower.includes('savor') || lower.includes('shopping') || lower.includes('rolex')) {
      cat = 'LIFESTYLE';
      carbonFactor = 0.012;
    } else if (lower.includes('aluguel') || lower.includes('condominio') || lower.includes('luz')) {
      cat = 'ESSENTIAL';
      carbonFactor = 0;
    } else if (lower.includes('invest') || lower.includes('etf') || lower.includes('fundo')) {
      cat = 'INVESTMENT';
      carbonFactor = 0;
    }

    setCategory(cat);
    const calculatedCarbon = (val * carbonFactor).toFixed(4);
    setCarbonResult(calculatedCarbon);

    showFeedback(`Demonstração Python: Categorizado como ${cat}.`, "success");
    speak(`O script em python analisou os metadados da transação e determinou a categoria ${cat} com pegada ecológica de ${calculatedCarbon} kg.`);
  };

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right duration-500 pb-32">
      <div className="luminous-card p-5" style={{ background: 'linear-gradient(135deg, #0b1530, #041226)', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 bg-sky-500/15 border border-sky-500/30 rounded-xl flex items-center justify-center shrink-0">
            <RefreshCw className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">regenera_transaction_categorizer.py</h3>
            <p className="text-xs text-gray-400 mt-0.5">Módulo de classificação heurística de transações e pegada ecológica.</p>
          </div>
        </div>
      </div>

      <div className="luminous-card p-5 space-y-4">
        <h4 className="font-bold text-sm text-white">Console de Categorização Interativa</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="input-label">Descrição da Transação</span>
            <input 
              type="text" 
              value={desc} 
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ex: Uber Trips" 
              className="input-field text-xs px-3 w-full"
            />
          </div>
          <div className="space-y-1.5">
            <span className="input-label">Valor (R$)</span>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ex: 320.00" 
              className="input-field text-xs px-3 w-full"
            />
          </div>
        </div>

        <button onClick={runPythonSimulation} className="btn-primary w-full py-3 text-xs font-bold uppercase tracking-wider rounded-lg">
          Executar Algoritmo Heurístico Python
        </button>

        {category !== 'none' && (
          <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-3 animate-in zoom-in">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Categoria Heurística</span>
              <span className="font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20">{category}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Pegada Ecológica</span>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">{carbonResult} kg CO2e</span>
            </div>
          </div>
        )}
      </div>

      {/* transactions table */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Histórico Auditado de Categorias (Python)</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Categoria</th>
                <th>CO2e</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>01/06</td>
                <td>Pix Recebido - Cliente Alpha</td>
                <td className="font-mono text-emerald-400">R$ 2.500,00</td>
                <td><span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded text-[9px] font-bold">SALARY</span></td>
                <td>—</td>
              </tr>
              <tr>
                <td>14/06</td>
                <td>Restaurante Savor</td>
                <td className="font-mono text-red-400">R$ 320,00</td>
                <td><span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded text-[9px] font-bold">LIFESTYLE</span></td>
                <td className="text-amber-400 font-mono text-[10px]">0.0038 kg</td>
              </tr>
              <tr>
                <td>15/06</td>
                <td>Posto Energia</td>
                <td className="font-mono text-red-400">R$ 180,00</td>
                <td><span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded text-[9px] font-bold">TRANSPORT</span></td>
                <td className="text-amber-400 font-mono text-[10px]">0.0153 kg</td>
              </tr>
              <tr>
                <td>18/06</td>
                <td>Aluguel Studio</td>
                <td className="font-mono text-red-400">R$ 4.500,00</td>
                <td><span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded text-[9px] font-bold">ESSENTIAL</span></td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------
// 8. DESCONTOS
// --------------------------------------------------------------------------
export const Descontos: React.FC<FeedbackHelper> = ({ showFeedback, speak }) => {
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  const activateCoupon = (name: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    showFeedback(`Cupom "${code}" copiado para área de transferência!`, "success");
    speak(`Cupom de desconto para ${name} copiado com sucesso.`);
    setTimeout(() => setCopiedCoupon(null), 3000);
  };

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right duration-500 pb-32">
      <div className="luminous-card p-5" style={{ background: 'linear-gradient(135deg, #300216, #14010a)', borderColor: 'rgba(240, 85, 107, 0.3)' }}>
        <div className="flex gap-3 items-center">
          <div className="p-2.5 bg-red-500/20 rounded-xl text-red-400">
            <Copy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Descontos Exclusivos</h3>
            <p className="text-xs text-red-300 font-bold uppercase tracking-wider mt-0.5">Parcerias e vantagens de alta categoria.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { name: 'Regenera Music', desc: '3 Meses Grátis', code: 'REGMUSIC3M' },
          { name: 'Regenera Move', desc: '20% OFF Aluguel', code: 'REGMOVE20' },
          { name: 'Regenera Coffee', desc: 'Café Espresso Grátis', code: 'REGCOFFEE' },
          { name: 'Regenera Mall', desc: '15% OFF Marcas Luxo', code: 'REGMALL15' }
        ].map((item, idx) => {
          const isCopied = copiedCoupon === item.code;
          return (
            <div key={idx} className="luminous-card p-5 flex flex-col justify-between h-40 hover:border-red-500/30 transition-all">
              <div>
                <h4 className="font-bold text-white text-base">{item.name}</h4>
                <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
              </div>
              <button 
                onClick={() => activateCoupon(item.name, item.code)} 
                className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg w-full transition-all border ${isCopied ? 'bg-red-500/20 border-red-500 text-red-400' : 'btn-ghost border-white/10'}`}
              >
                {isCopied ? 'Copiado!' : 'Ativar'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------
// 9. EVENTOS
// --------------------------------------------------------------------------
export const Eventos: React.FC<FeedbackHelper> = ({ showFeedback, speak }) => {
  const [viewingTicket, setViewingTicket] = useState<string | null>(null);

  const showTicket = (title: string) => {
    setViewingTicket(title);
    showFeedback(`Exibindo ingresso para ${title}`, "success");
    speak(`Renderizando convite exclusivo e QR code para ${title}.`);
  };

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right duration-500 pb-32">
      <div className="luminous-card p-5 flex items-center justify-between">
        <h4 className="font-bold text-sm text-white">Eventos & Networking Corporativo</h4>
        <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Membro VIP</span>
      </div>

      <div className="space-y-4">
        {[
          { title: 'Summit de Investidores 2026', date: '15 Dez • 19:00', loc: 'Hotel Unique, SP', confirmed: true, qr: 'SUMMIT-1234' },
          { title: 'Painel Web3 & Future Money', date: '22 Jan • 14:00', loc: 'Museu do Amanhã, RJ', confirmed: true, qr: 'WEB3-9842' }
        ].map((evt, idx) => (
          <div key={idx} className="luminous-card overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-cyan-950/20 to-bg-deep/80 border-b border-white/5 flex justify-between items-center">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Acesso Confirmado</span>
              <Calendar className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h4 className="font-bold text-lg text-white leading-tight">{evt.title}</h4>
                <div className="flex gap-4 text-xs text-gray-400 mt-2 font-mono">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {evt.date}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {evt.loc}</span>
                </div>
              </div>

              <button onClick={() => showTicket(evt.title)} className="btn-ghost flex items-center justify-center gap-1.5 w-full py-2.5 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-colors">
                <Ticket className="w-4 h-4 text-cyan-400" /> Ver Ingresso
              </button>
            </div>
          </div>
        ))}
      </div>

      {viewingTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setViewingTicket(null)}></div>
          <div className="relative bg-bg-mid border border-white/10 p-6 rounded-3xl w-full max-w-sm text-center shadow-2xl space-y-6 animate-in zoom-in">
            <div>
              <h3 className="font-bold text-lg text-white leading-tight">{viewingTicket}</h3>
              <p className="text-xs text-gray-400 mt-1">Regenera Bank Exclusive Pass</p>
            </div>

            <div className="bg-white p-4 rounded-2xl w-44 h-44 mx-auto flex items-center justify-center shadow-inner">
              {/* QR Code Graphic with CSS */}
              <div className="w-full h-full bg-[radial-gradient(#000_3px,transparent_4px)] bg-[size:10px_10px] opacity-80"></div>
            </div>

            <div className="bg-black/20 p-3 rounded-xl border border-white/5 font-mono text-xs text-gray-400">
              COD: REG-{Math.floor(100000 + Math.random() * 900000)}
            </div>

            <button onClick={() => setViewingTicket(null)} className="btn-primary w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider">
              Fechar Convite
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
