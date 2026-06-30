
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { 
    ArrowUpRight, ArrowDownLeft, QrCode, Copy, Trash2, Plus, 
    CheckCircle, Share2, Key, Zap, Smartphone, ArrowRight, 
    Mail, Hash, CreditCard, Loader2, RefreshCw, X, ShieldCheck,
    User, AlertTriangle
} from 'lucide-react';
import { PixKey, Transaction, Contact } from '../../types';

const MOCK_KEYS: PixKey[] = [
    { id: '1', type: 'cpf', key: '123.456.789-00', createdAt: '12/08/2023' },
    { id: '2', type: 'email', key: 'don.paulo@regenera.bank', createdAt: '10/01/2024' },
    { id: '3', type: 'random', key: 'a1b2-c3d4-e5f6-7890-uuid-v4', createdAt: '15/02/2024' },
    { id: '4', type: 'phone', key: '(11) 99999-8888', createdAt: '20/02/2024' },
];

const MOCK_HISTORY: Transaction[] = [
    { id: 'pix1', title: 'Transferência Enviada', party: 'Carlos Tech', date: 'Hoje 10:23', amount: -150.00, type: 'outflow', icon: 'send', category: 'essential' },
    { id: 'pix2', title: 'Pix Recebido', party: 'Cliente Alpha', date: 'Ontem 18:40', amount: 2500.00, type: 'inflow', icon: 'download', category: 'lifestyle' },
    { id: 'pix3', title: 'Pagamento QR', party: 'Restaurante Savor', date: '20/02', amount: -320.90, type: 'outflow', icon: 'qr_code', category: 'leisure' },
    { id: 'pix4', title: 'Aluguel Studio', party: 'Imobiliária Prime', date: '15/02', amount: -4500.00, type: 'outflow', icon: 'home', category: 'essential' },
    { id: 'pix5', title: 'Reembolso Viagem', party: 'Regenera Corp', date: '10/02', amount: 1250.00, type: 'inflow', icon: 'plane', category: 'lifestyle' },
];

const RECENT_CONTACTS: Contact[] = [
    { id: '1', name: 'Mãe', key: '11999998888', bank: 'Nubank' },
    { id: '2', name: 'João Silva', key: 'joao@email.com', bank: 'Inter' },
    { id: '3', name: 'Uber Trips', key: 'cnpj-uber', bank: 'Citi' },
];

interface PixAreaProps {
    initialAction?: {
        type: 'send' | 'receive';
        value?: number;
        to?: string;
    } | null;
}

const PixArea: React.FC<PixAreaProps> = ({ initialAction }) => {
    const [activeTab, setActiveTab] = useState<'send' | 'receive' | 'keys' | 'history'>(initialAction?.type === 'receive' ? 'receive' : 'send');
    
    // --- SEND PIX STATE ---
    const [sendStep, setSendStep] = useState<'form' | 'processing' | 'success'>('form');
    const [showConfirmModal, setShowConfirmModal] = useState(false); // New explicit modal state
    
    const [pixKey, setPixKey] = useState(initialAction?.to || '');
    const [amount, setAmount] = useState(initialAction?.value ? initialAction.value.toString() : '');
    const [keyType, setKeyType] = useState<'cpf' | 'email' | 'phone' | 'random' | null>(null);
    const [contactName, setContactName] = useState('Destinatário Desconhecido');

    // --- RECEIVE PIX STATE ---
    const [receiveAmount, setReceiveAmount] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    // --- KEYS STATE ---
    const [myKeys, setMyKeys] = useState<PixKey[]>(MOCK_KEYS);
    const [isAddingKey, setIsAddingKey] = useState(false);
    const [newKeyInput, setNewKeyInput] = useState('');
    const [newKeyType, setNewKeyType] = useState<'cpf' | 'email' | 'phone' | 'random'>('random');

    // --- EFFECTS ---

    // Detect Key Type Logic
    useEffect(() => {
        const cleanKey = pixKey.trim();
        if (!cleanKey) {
            setKeyType(null);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^(\(?\d{2}\)?\s?)?9\d{4}-?\d{4}$/;
        const cpfClean = cleanKey.replace(/\D/g, '');
        
        if (emailRegex.test(cleanKey)) setKeyType('email');
        else if (phoneRegex.test(cleanKey) || (cpfClean.length >= 10 && cpfClean.length <= 11 && !cleanKey.includes('@') && cleanKey.length < 15)) setKeyType('phone');
        else if (cpfClean.length === 11) setKeyType('cpf');
        else if (cleanKey.length > 20) setKeyType('random');
        else setKeyType('random'); // Default fallback

        // Mock Contact Name Resolution
        const contact = RECENT_CONTACTS.find(c => c.key === cleanKey);
        if (contact) setContactName(contact.name);
        else if (cleanKey.length > 5) setContactName('Carlos Oliveira (Mock)');
        else setContactName('Destinatário...');

    }, [pixKey]);

    // Dynamic QR Code Update
    useEffect(() => {
        const baseUrl = "https://api.qrserver.com/v1/create-qr-code/";
        const data = `regenerabank-transfer-${receiveAmount || 'any'}-user-donpaulo`;
        setQrCodeUrl(`${baseUrl}?size=250x250&data=${data}&bgcolor=ffffff&color=000000&margin=10`);
    }, [receiveAmount]);

    // Auto-fill from props
    useEffect(() => {
        if (initialAction) {
            if (initialAction.type === 'send') {
                setActiveTab('send');
                if (initialAction.value) setAmount(initialAction.value.toString());
                if (initialAction.to) setPixKey(initialAction.to);
            } else if (initialAction.type === 'receive') {
                setActiveTab('receive');
                if (initialAction.value) setReceiveAmount(initialAction.value.toString());
            }
        }
    }, [initialAction]);

    // --- HANDLERS ---

    const handleConfirmSend = () => {
        setShowConfirmModal(false);
        setSendStep('processing');
        setTimeout(() => {
            setSendStep('success');
        }, 2500);
    };

    const handleCopy = (text: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        }
    };
    
    const handleShare = async (title: string, text: string) => {
        if (navigator.share) {
            try {
                await navigator.share({ title, text });
            } catch (err) {
                console.log('Share failed', err);
            }
        }
    };

    const handleDeleteKey = (id: string) => {
        if (confirm("Deseja realmente excluir esta chave?")) {
            setMyKeys(prev => prev.filter(k => k.id !== id));
        }
    };

    const handleAddKey = () => {
        if (!newKeyInput) return;
        const newKey: PixKey = {
            id: Date.now().toString(),
            type: newKeyType,
            key: newKeyInput,
            createdAt: new Date().toLocaleDateString()
        };
        setMyKeys([...myKeys, newKey]);
        setIsAddingKey(false);
        setNewKeyInput('');
    };

    const getKeyIcon = (type: string | null) => {
        switch (type) {
            case 'email': return <Mail className="w-5 h-5 text-cyan-400" />;
            case 'phone': return <Smartphone className="w-5 h-5 text-amber-400" />;
            case 'cpf': return <CreditCard className="w-5 h-5 text-emerald-400" />;
            case 'random': return <Hash className="w-5 h-5 text-purple-400" />;
            default: return <Key className="w-5 h-5 text-gray-500" />;
        }
    };

    // --- RENDERERS ---

    const renderTabs = () => (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
            {[
                { id: 'send', label: 'Enviar Pix', icon: ArrowUpRight },
                { id: 'receive', label: 'Receber', icon: ArrowDownLeft },
                { id: 'keys', label: 'Minhas Chaves', icon: Key },
                { id: 'history', label: 'Extrato', icon: Zap },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                        activeTab === tab.id 
                        ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(8,145,178,0.4)] scale-105' 
                        : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                </button>
            ))}
        </div>
    );

    return (
        <div className="p-6 animate-in slide-in-from-right duration-500 pb-32 min-h-[70vh] relative">
            {renderTabs()}

            {/* CONFIRMATION MODAL OVERLAY */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-gradient-to-br from-bg-mid to-bg-deep border border-cyan-500/30 w-full max-w-md rounded-[2rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500"></div>
                        <button onClick={() => setShowConfirmModal(false)} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>

                        <div className="text-center mb-8 mt-4">
                            <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
                                <ShieldCheck className="w-8 h-8 text-cyan-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">Confirmar Pix</h3>
                            <p className="text-xs text-gray-400 uppercase tracking-widest">Revisão de Segurança</p>
                        </div>

                        <div className="bg-white/5 rounded-2xl p-6 space-y-4 mb-8 border border-white/5">
                            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                <span className="text-gray-400 text-xs uppercase font-bold">Valor</span>
                                <span className="text-3xl font-bold text-white tracking-tight">R$ {parseFloat(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Para</span>
                                    <span className="text-white font-bold">{contactName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Chave</span>
                                    <span className="text-white font-mono opacity-80">{pixKey}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Instituição</span>
                                    <span className="text-white">Banco Inter (Simulado)</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Data</span>
                                    <span className="text-white">Hoje (Agora)</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-xs text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleConfirmSend}
                                className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Enviar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== SEND TAB ===== */}
            {activeTab === 'send' && (
                <div className="animate-in fade-in">
                    {sendStep === 'form' && (
                        <div className="space-y-6">
                            {/* Unified Card for Inputs */}
                            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group hover:border-cyan-500/20 transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Zap className="w-32 h-32 text-white" />
                                </div>
                                
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-6">Dados da Transação</h3>
                                
                                {/* Amount Input */}
                                <div className="mb-8 text-center relative z-10">
                                    <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Valor a enviar</label>
                                    <div className="relative inline-block group/input">
                                        <span className="absolute left-[-2rem] top-1/2 -translate-y-1/2 text-2xl text-gray-500 font-bold opacity-50 transition-opacity group-focus-within/input:opacity-100 group-focus-within/input:text-cyan-400">R$</span>
                                        <input 
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0,00"
                                            className="bg-transparent text-5xl font-bold text-white placeholder-gray-700 outline-none w-48 text-center transition-all focus:scale-110"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {/* Key Input */}
                                <div className="relative z-10">
                                    <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Chave Pix</label>
                                    <div className="relative group/key">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform group-focus-within/key:scale-110">
                                            {getKeyIcon(keyType)}
                                        </div>
                                        <input
                                            type="text"
                                            value={pixKey}
                                            onChange={(e) => setPixKey(e.target.value)}
                                            placeholder="CPF, Email, Telefone ou Aleatória"
                                            className={`block w-full pl-12 pr-4 py-4 border rounded-2xl leading-5 bg-black/20 text-white placeholder-gray-600 focus:outline-none transition-all ${keyType ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'border-white/10 focus:border-cyan-500/30'}`}
                                        />
                                        {keyType && (
                                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center animate-in zoom-in">
                                                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/50 px-2 py-1 rounded border border-cyan-500/30 uppercase tracking-wide">
                                                    {keyType}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Quick Contacts */}
                                <div className="mt-6 relative z-10">
                                    <p className="text-[10px] text-gray-600 uppercase font-bold mb-3 tracking-widest">Recentes</p>
                                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                        {RECENT_CONTACTS.map(contact => (
                                            <button 
                                                key={contact.id}
                                                onClick={() => setPixKey(contact.key)}
                                                className="flex items-center gap-2 bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 rounded-full px-3 py-1.5 transition-all whitespace-nowrap group/contact"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-[10px] font-bold text-white group-hover/contact:from-cyan-600 group-hover/contact:to-blue-600">
                                                    {contact.name.charAt(0)}
                                                </div>
                                                <span className="text-xs text-gray-400 group-hover/contact:text-white font-medium">{contact.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setShowConfirmModal(true)}
                                disabled={!amount || !pixKey}
                                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${amount && pixKey ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/30 hover:shadow-cyan-500/50' : 'bg-white/5 text-gray-600 cursor-not-allowed'}`}
                            >
                                Continuar <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {sendStep === 'processing' && (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-center animate-in fade-in">
                            <div className="relative w-24 h-24 mb-8">
                                <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin"></div>
                                <Loader2 className="absolute inset-0 m-auto w-10 h-10 text-cyan-400 animate-pulse" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Processando Transação</h3>
                            <p className="text-sm text-gray-400 animate-pulse">Autenticando via Blockchain Neural...</p>
                        </div>
                    )}

                    {sendStep === 'success' && (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 animate-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)] relative">
                                <div className="absolute inset-0 rounded-full border border-emerald-500/50 animate-ping"></div>
                                <CheckCircle className="w-12 h-12 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Pix Enviado!</h2>
                            <p className="text-gray-400 mb-8">R$ {parseFloat(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para {contactName}</p>
                            
                            <div className="flex gap-4 w-full">
                                <button 
                                    onClick={() => handleShare('Comprovante Pix', `Pix de R$ ${amount} enviado para ${contactName} via Regenera Bank.`)}
                                    className="flex-1 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Share2 className="w-4 h-4" /> Comprovante
                                </button>
                                <button onClick={() => { setSendStep('form'); setPixKey(''); setAmount(''); }} className="flex-1 py-3 bg-cyan-600 rounded-xl font-bold hover:bg-cyan-500 transition-colors">
                                    Novo Pix
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===== RECEIVE TAB ===== */}
            {activeTab === 'receive' && (
                <div className="flex flex-col items-center space-y-8 animate-in fade-in pt-4">
                    <div className="relative group cursor-pointer" onClick={() => handleCopy(qrCodeUrl)}>
                        <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-[2rem] blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
                        <div className="relative bg-white p-6 rounded-[1.8rem] shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                            <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mix-blend-multiply" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-[1.8rem]">
                                <Copy className="w-10 h-10 text-cyan-600" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="w-full max-w-sm">
                        <label className="block text-xs text-gray-500 font-bold uppercase tracking-widest mb-2 text-center">Valor do Recebimento (Opcional)</label>
                        <div className="relative group/input">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold group-focus-within/input:text-cyan-400 transition-colors">R$</span>
                            <input 
                                type="number" 
                                value={receiveAmount}
                                onChange={(e) => setReceiveAmount(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-10 text-white text-center font-bold text-xl focus:border-cyan-500 outline-none transition-all shadow-inner"
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    <div className="space-y-3 w-full max-w-sm">
                        <button 
                            onClick={() => handleCopy("00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913Cicrano de Tal6008BRASILIA62070503***6304E2CA")}
                            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-white uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                        >
                            <Copy className="w-4 h-4" /> Copiar Código Pix
                        </button>
                        <button 
                             onClick={() => handleShare('QR Code Pix', `Pague meu Pix: ${qrCodeUrl}`)}
                             className="w-full py-4 border border-white/10 hover:bg-white/5 rounded-xl font-bold text-gray-400 hover:text-white uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                        >
                            <Share2 className="w-4 h-4" /> Compartilhar Link
                        </button>
                    </div>
                </div>
            )}

            {/* ===== KEYS TAB ===== */}
            {activeTab === 'keys' && (
                <div className="space-y-4 animate-in fade-in">
                    {!isAddingKey ? (
                        <>
                            <button 
                                onClick={() => setIsAddingKey(true)} 
                                className="w-full py-5 border border-dashed border-cyan-500/30 bg-cyan-500/5 rounded-2xl text-cyan-400 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-cyan-500/10 transition-all hover:scale-[1.01] shadow-[0_0_20px_rgba(34,211,238,0.05)]"
                            >
                                <Plus className="w-5 h-5" /> Cadastrar Nova Chave
                            </button>
                            
                            <div className="grid gap-3">
                                {myKeys.map(key => (
                                    <div key={key.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors group hover:border-white/20">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-black/20 rounded-xl text-gray-400 group-hover:text-white transition-colors border border-white/5 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10">
                                                {getKeyIcon(key.type)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider">{key.type}</p>
                                                    <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                                    <p className="text-[10px] text-gray-500">{key.createdAt}</p>
                                                </div>
                                                <p className="font-mono text-sm text-white mt-0.5">{key.key}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleCopy(key.key)}
                                                className="p-2.5 text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors" 
                                                title="Copiar Chave"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteKey(key.id)}
                                                className="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" 
                                                title="Excluir Chave"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 animate-in zoom-in shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-white">Nova Chave Pix</h3>
                                <button onClick={() => setIsAddingKey(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-2 mb-6">
                                {['cpf', 'email', 'phone', 'random'].map(type => (
                                    <button 
                                        key={type}
                                        onClick={() => setNewKeyType(type as any)}
                                        className={`p-3 rounded-xl flex flex-col items-center gap-2 border transition-all ${newKeyType === type ? 'bg-cyan-600/20 border-cyan-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'}`}
                                    >
                                        {getKeyIcon(type)}
                                        <span className="text-[9px] font-bold uppercase tracking-wider">{type === 'random' ? 'Aleatória' : type}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="mb-8">
                                <label className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2 block">Chave</label>
                                <input 
                                    type="text" 
                                    value={newKeyInput}
                                    onChange={(e) => setNewKeyInput(e.target.value)}
                                    placeholder={newKeyType === 'random' ? 'Gerar aleatória...' : `Digite seu ${newKeyType}`}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:border-cyan-500 outline-none"
                                />
                            </div>

                            <button 
                                onClick={handleAddKey} 
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg"
                            >
                                Cadastrar Chave
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ===== HISTORY TAB ===== */}
            {activeTab === 'history' && (
                <div className="space-y-3 animate-in fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Últimos 30 dias</h3>
                        <button className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                    {MOCK_HISTORY.map((t, idx) => (
                        <div 
                            key={t.id} 
                            style={{ animationDelay: `${idx * 50}ms` }}
                            className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors animate-in slide-in-from-bottom-2 fill-mode-backwards group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/5 transition-transform group-hover:scale-110 ${t.type === 'inflow' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">{t.title}</h4>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">{t.party} • {t.date}</p>
                                </div>
                            </div>
                            <span className={`font-mono text-sm font-bold ${t.type === 'inflow' ? 'text-emerald-400' : 'text-gray-400'}`}>
                                {t.type === 'inflow' ? '+' : '-'} {Math.abs(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PixArea;
