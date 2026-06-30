
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { 
    Building2, Calendar, User, ArrowRight, CheckCircle, Shield, 
    Star, Clock, Download, Share2, MoreVertical, Trash2, Edit2, 
    Plus, AlertCircle, Search, FileText, ChevronRight, Bell
} from 'lucide-react';
import { Contact } from '../../types';

const BANKS = [
    { code: '001', name: 'Banco do Brasil' },
    { code: '237', name: 'Bradesco' },
    { code: '341', name: 'Itaú Unibanco' },
    { code: '033', name: 'Santander' },
    { code: '260', name: 'Nubank' },
    { code: '077', name: 'Inter' },
    { code: '655', name: 'Votorantim' },
];

const MOCK_FAVORITES: Contact[] = [
    { id: '1', name: 'Contabilidade Alpha', key: '', bank: 'Itaú', agency: '3000', account: '12345-6', cpf: '00.000.000/0001-00' },
    { id: '2', name: 'Condomínio', key: '', bank: 'Bradesco', agency: '1234', account: '55555-0', cpf: '99.999.999/0001-99' },
    { id: '3', name: 'Mãe', key: '', bank: 'Banco do Brasil', agency: '1890', account: '8900-1', cpf: '123.456.789-00' },
];

const MOCK_SCHEDULED = [
    { id: 's1', name: 'Aluguel Escritório', date: '05/12/2024', value: 4500.00, bank: 'Bradesco' },
    { id: 's2', name: 'Escola Kids', date: '10/12/2024', value: 3200.00, bank: 'Itaú' },
];

const MOCK_RECEIPTS = [
    { id: 'r1', name: 'Consultoria TI', date: '20/11/2024', value: 2500.00, auth: '8921.BB.901' },
    { id: 'r2', name: 'Fornecedor A', date: '15/11/2024', value: 890.50, auth: '1234.IT.888' },
];

interface TransferAreaProps {
    initialAction?: {
        type: 'send';
        value?: number;
        to?: string;
    } | null;
}

const TransferArea: React.FC<TransferAreaProps> = ({ initialAction }) => {
    const [view, setView] = useState<'new' | 'favorites' | 'scheduled' | 'receipts'>('new');
    const [step, setStep] = useState(1);
    
    // Form Data
    const [formData, setFormData] = useState({
        bank: '',
        agency: '',
        account: '',
        type: 'checking',
        name: '',
        cpf: '',
        value: '',
        date: '',
        reminder: false
    });

    const [displayAmount, setDisplayAmount] = useState('');
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    // Pre-fill from AI
    useEffect(() => {
        if (initialAction && initialAction.type === 'send') {
            setView('new');
            // Simulate filling initial data if AI provided it
            if (initialAction.value) {
                 const valStr = initialAction.value.toString();
                 handleChange('value', valStr);
                 setDisplayAmount(initialAction.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
            }
            if (initialAction.to) {
                handleChange('name', initialAction.to);
                // Smart Match logic for mock purposes
                const fav = MOCK_FAVORITES.find(f => f.name.toLowerCase().includes(initialAction.to!.toLowerCase()));
                if (fav) {
                    handleChange('bank', BANKS.find(b => b.name.includes(fav.bank))?.code || '000');
                    handleChange('agency', fav.agency || '');
                    handleChange('account', fav.account || '');
                    handleChange('cpf', fav.cpf || '');
                    setStep(2); // Skip bank details if favorite found
                }
            }
        }
    }, [initialAction]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        if (!raw) {
            handleChange('value', '');
            setDisplayAmount('');
            return;
        }
        const val = Number(raw) / 100;
        handleChange('value', val.toString());
        setDisplayAmount(val.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    };

    const handleConfirmTransfer = () => {
        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            setSuccess(true);
        }, 3000);
    };

    const isStep1Valid = formData.bank && formData.agency && formData.account;
    const isStep2Valid = formData.name && formData.cpf && formData.value;

    const renderHeader = () => (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
            {[
                { id: 'new', label: 'Nova TED' },
                { id: 'favorites', label: 'Favorecidos' },
                { id: 'scheduled', label: 'Agendamentos' },
                { id: 'receipts', label: 'Comprovantes' },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => { setView(tab.id as any); setStep(1); setSuccess(false); }}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                        view === tab.id 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                        : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );

    const renderInput = (label: string, field: keyof typeof formData, placeholder: string, type = "text") => (
        <div className="mb-4">
            <label className="block text-xs text-primary/80 font-bold uppercase tracking-widest mb-2 pl-1">{label}</label>
            <input 
                type={type}
                placeholder={placeholder}
                value={formData[field] as string}
                onChange={(e) => handleChange(field as string, e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:border-primary focus:bg-white/10 focus:outline-none transition-all focus:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
            />
        </div>
    );

    // --- SUCCESS VIEW ---
    if (success) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(59,130,246,0.3)] relative">
                    <div className="absolute inset-0 rounded-full border border-primary/50 animate-ping"></div>
                    <CheckCircle className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Transferência Realizada!</h2>
                <p className="text-gray-400 mb-4">
                    R$ {displayAmount} enviados para <br/>
                    <strong className="text-white">{formData.name}</strong>
                </p>
                {formData.reminder && (
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 mb-8">
                        <Bell className="w-4 h-4 text-primary" />
                        <span className="text-xs text-gray-300">Lembrete de agendamento criado.</span>
                    </div>
                )}
                
                <div className="space-y-3 w-full max-w-sm">
                    <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                        <Share2 className="w-4 h-4" /> Compartilhar Comprovante
                    </button>
                    <button 
                        onClick={() => { setSuccess(false); setStep(1); setFormData({ ...formData, value: '', name: '', cpf: '', reminder: false }); setDisplayAmount(''); }} 
                        className="w-full py-4 bg-primary hover:bg-primary-dark rounded-xl font-bold text-white transition-colors"
                    >
                        Nova Transferência
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 animate-in slide-in-from-right duration-500 pb-32 min-h-[70vh]">
            {renderHeader()}

            {view === 'new' && (
                <>
                    {/* Progress Bar */}
                    <div className="flex gap-2 mb-8 px-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-primary shadow-[0_0_10px_#3b82f6]' : 'bg-white/10'}`}></div>
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Building2 className="text-primary" /> Dados Bancários
                            </h3>
                            
                            <div className="mb-4">
                                <label className="block text-xs text-gray-500 font-bold uppercase tracking-widest mb-2 pl-1">Instituição</label>
                                <div className="relative">
                                    <select 
                                        value={formData.bank} 
                                        onChange={(e) => handleChange('bank', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none appearance-none cursor-pointer transition-colors hover:bg-white/10"
                                    >
                                        <option value="" className="bg-bg-deep text-gray-500">Selecione o Banco</option>
                                        {BANKS.map(b => (
                                            <option key={b.code} value={b.code} className="bg-bg-mid text-white">{b.code} - {b.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    {renderInput('Agência', 'agency', '0000')}
                                </div>
                                <div className="flex-[2]">
                                    {renderInput('Conta', 'account', '00000-0')}
                                </div>
                            </div>
                            
                            <div className="flex gap-2 mb-6">
                                {['Corrente', 'Poupança'].map(type => (
                                    <button 
                                        key={type}
                                        onClick={() => handleChange('type', type.toLowerCase())}
                                        className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                                            formData.type === type.toLowerCase() 
                                            ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/10' 
                                            : 'bg-transparent border-white/10 text-gray-500 hover:border-white/30'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3 items-start mb-6">
                                <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <p className="text-xs text-primary/80 leading-relaxed">
                                    Transferências TED caem no mesmo dia útil se feitas até as 17h.
                                </p>
                            </div>

                            <button 
                                onClick={() => isStep1Valid && setStep(2)}
                                disabled={!isStep1Valid}
                                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 ${isStep1Valid ? 'bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-dark hover:scale-[1.02]' : 'bg-white/5 text-gray-600 cursor-not-allowed'}`}
                            >
                                Continuar <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <User className="text-primary" /> Favorecido & Valor
                            </h3>

                            {renderInput('Nome Completo', 'name', 'Nome do destinatário')}
                            {renderInput('CPF / CNPJ', 'cpf', '000.000.000-00')}
                            
                            <div className="mb-6">
                                <label className="block text-xs text-gray-500 font-bold uppercase tracking-widest mb-2 pl-1">Valor</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-bold group-focus-within:text-primary transition-colors">R$</span>
                                    <input 
                                        type="text"
                                        value={displayAmount}
                                        onChange={handleAmountChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-10 text-white text-xl font-bold focus:border-primary outline-none transition-all focus:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 mb-6 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-all">
                                <div className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" id="schedule" className="w-4 h-4 rounded border-gray-600 bg-transparent text-primary focus:ring-primary cursor-pointer accent-primary" />
                                    <label htmlFor="schedule" className="text-sm text-gray-400 flex items-center gap-2 cursor-pointer select-none flex-1">
                                        <Calendar className="w-4 h-4" /> Agendar para data futura
                                    </label>
                                </div>

                                <div className="flex items-center gap-3 cursor-pointer pl-1">
                                    <div 
                                        onClick={() => handleChange('reminder', !formData.reminder)}
                                        className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.reminder ? 'bg-primary' : 'bg-gray-700'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.reminder ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                    <span className="text-sm text-gray-400 flex items-center gap-2 select-none" onClick={() => handleChange('reminder', !formData.reminder)}>
                                        <Bell className="w-4 h-4" /> Definir Lembrete
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setStep(1)} className="flex-1 py-4 text-xs font-bold uppercase text-gray-500 hover:text-white transition-colors">Voltar</button>
                                <button 
                                    onClick={() => isStep2Valid && setStep(3)}
                                    disabled={!isStep2Valid}
                                    className={`flex-[2] py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 ${isStep2Valid ? 'bg-primary text-white shadow-lg shadow-primary/30 hover:scale-[1.02]' : 'bg-white/5 text-gray-600'}`}
                                >
                                    Revisar
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in fade-in zoom-in">
                            <div className="bg-gradient-to-br from-bg-mid to-bg-deep border border-white/10 rounded-2xl p-6 relative overflow-hidden mb-6 shadow-2xl group">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                                <div className="flex flex-col items-center justify-center mb-6 border-b border-white/5 pb-6 relative z-10">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Valor Total</p>
                                    <h2 className="text-4xl font-bold text-white text-glow">R$ {displayAmount || '0,00'}</h2>
                                </div>
                                
                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                                        <span className="text-gray-400 text-sm">Para</span>
                                        <span className="text-white font-bold text-right">{formData.name}</span>
                                    </div>
                                    <div className="flex justify-between px-2">
                                        <span className="text-gray-500 text-sm">CPF</span>
                                        <span className="text-white font-mono text-sm text-right opacity-80">{formData.cpf}</span>
                                    </div>
                                    <div className="flex justify-between px-2">
                                        <span className="text-gray-500 text-sm">Banco</span>
                                        <span className="text-white text-right">{BANKS.find(b => b.code === formData.bank)?.name || formData.bank}</span>
                                    </div>
                                    <div className="flex justify-between px-2">
                                        <span className="text-gray-500 text-sm">Ag/Conta</span>
                                        <span className="text-white font-mono text-sm text-right opacity-80">{formData.agency} / {formData.account}</span>
                                    </div>
                                    {formData.reminder && (
                                        <div className="flex justify-between px-2 items-center text-primary">
                                            <span className="text-xs font-bold uppercase">Lembrete Ativo</span>
                                            <Bell className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button 
                                onClick={handleConfirmTransfer}
                                disabled={processing}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                            >
                                {processing ? (
                                    <>Processing <span className="animate-spin ml-2">⏳</span></>
                                ) : (
                                    <><CheckCircle className="w-5 h-5" /> Confirmar Transferência</>
                                )}
                            </button>
                            
                            {!processing && (
                                <button onClick={() => setStep(2)} className="w-full mt-4 py-2 text-xs text-gray-500 hover:text-white uppercase tracking-widest transition-colors">
                                    Corrigir Dados
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}

            {view === 'favorites' && (
                <div className="space-y-4 animate-in fade-in">
                    <button className="w-full py-4 border border-dashed border-primary/30 bg-primary/5 rounded-xl text-primary text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/10 transition-all hover:border-primary/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                        <Plus className="w-4 h-4" /> Adicionar Favorecido
                    </button>

                    {MOCK_FAVORITES.map(fav => (
                         <div 
                            key={fav.id} 
                            onClick={() => {
                                handleChange('name', fav.name);
                                handleChange('bank', BANKS.find(b => b.name.includes(fav.bank))?.code || '001');
                                handleChange('agency', fav.agency || '');
                                handleChange('account', fav.account || '');
                                handleChange('cpf', fav.cpf || '');
                                setView('new');
                                setStep(2);
                            }}
                            className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors group cursor-pointer hover:border-primary/30"
                         >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-900 to-bg-deep flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-all shadow-lg">
                                    <span className="font-bold text-white">{fav.name.charAt(0)}</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white group-hover:text-primary transition-colors">{fav.name}</h4>
                                    <p className="text-xs text-gray-500">{fav.bank}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-gray-500 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                                <button className="p-2 text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                            </div>
                         </div>
                    ))}
                </div>
            )}

            {view === 'scheduled' && (
                 <div className="space-y-4 animate-in fade-in">
                     {MOCK_SCHEDULED.map(s => (
                         <div key={s.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                 <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-500">
                                     <Clock className="w-5 h-5" />
                                 </div>
                                 <div>
                                     <h4 className="font-bold text-white">{s.name}</h4>
                                     <p className="text-xs text-gray-500">{s.date} • {s.bank}</p>
                                 </div>
                             </div>
                             <div className="text-right">
                                 <p className="font-bold text-white">R$ {s.value.toLocaleString('pt-BR')}</p>
                                 <button className="text-[10px] text-red-400 font-bold uppercase hover:text-red-300 mt-1">Cancelar</button>
                             </div>
                         </div>
                     ))}
                 </div>
            )}

            {view === 'receipts' && (
                <div className="space-y-4 animate-in fade-in">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input type="text" placeholder="Buscar comprovante..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 text-sm text-white focus:border-primary outline-none" />
                    </div>
                    {MOCK_RECEIPTS.map(r => (
                        <div key={r.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-500">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{r.name}</h4>
                                    <p className="text-xs text-gray-500">{r.date} • Auth: {r.auth}</p>
                                </div>
                            </div>
                            <button className="p-2 bg-white/5 rounded-lg hover:bg-primary hover:text-white transition-colors">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TransferArea;
