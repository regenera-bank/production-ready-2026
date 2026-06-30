
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { Contact } from '../../types';
import { User, QrCode, ArrowRight, CheckCircle, Smartphone } from 'lucide-react';

const RECENT_CONTACTS: Contact[] = [
    { id: '1', name: 'Mãe', key: '11999998888', bank: 'Nubank' },
    { id: '2', name: 'João Silva', key: 'joao@email.com', bank: 'Inter' },
    { id: '3', name: 'Uber Trips', key: 'cnpj-uber', bank: 'Citi' },
    { id: '4', name: 'Mercado Livre', key: 'random-key', bank: 'Itaú' },
];

const PixModule: React.FC = () => {
    const [step, setStep] = useState<'select' | 'amount' | 'confirm' | 'success'>('select');
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [amount, setAmount] = useState('');
    const [pixKeyInput, setPixKeyInput] = useState('');

    const handleContactSelect = (contact: Contact) => {
        setSelectedContact(contact);
        setStep('amount');
    };

    const handleConfirm = () => {
        setStep('success');
    };

    if (step === 'success') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-12 h-12 text-emerald-400 animate-bounce" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Pix Enviado!</h2>
                <p className="text-gray-400 mb-8">R$ {amount} para {selectedContact?.name}</p>
                <button onClick={() => { setStep('select'); setAmount(''); }} className="px-8 py-3 bg-white/10 rounded-full font-bold hover:bg-white/20 transition-colors">
                    Nova Transferência
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-in slide-in-from-right duration-500">
            {/* Steps Indicator */}
            <div className="flex items-center justify-between mb-8 px-4">
                {['Destino', 'Valor', 'Confirmação'].map((label, idx) => {
                    const isActive = (step === 'select' && idx === 0) || (step === 'amount' && idx === 1) || (step === 'confirm' && idx === 2);
                    const isPast = (step === 'amount' && idx === 0) || (step === 'confirm' && idx <= 1);
                    return (
                        <div key={label} className="flex flex-col items-center gap-2">
                            <div className={`w-3 h-3 rounded-full transition-colors ${isActive ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : isPast ? 'bg-emerald-400' : 'bg-white/10'}`}></div>
                            <span className={`text-[9px] uppercase tracking-widest ${isActive ? 'text-white font-bold' : 'text-gray-600'}`}>{label}</span>
                        </div>
                    )
                })}
            </div>

            {step === 'select' && (
                <>
                    <div className="relative group mb-6">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <QrCode className="h-5 w-5 text-gray-400" />
                         </div>
                         <input
                             type="text"
                             className="block w-full pl-10 pr-3 py-4 border border-white/10 rounded-xl leading-5 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-cyan-500/50 transition-colors"
                             placeholder="Chave Pix (CPF, Email, Celular)"
                             value={pixKeyInput}
                             onChange={(e) => setPixKeyInput(e.target.value)}
                         />
                         <button className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <ArrowRight className={`h-5 w-5 ${pixKeyInput ? 'text-cyan-400' : 'text-gray-600'}`} />
                         </button>
                    </div>

                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Recentes</h3>
                    <div className="space-y-2">
                        {RECENT_CONTACTS.map(contact => (
                            <button 
                                key={contact.id} 
                                onClick={() => handleContactSelect(contact)}
                                className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border border-white/10 group-hover:border-cyan-500/50 transition-colors">
                                        <User className="w-5 h-5 text-gray-400 group-hover:text-cyan-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-white text-sm">{contact.name}</p>
                                        <p className="text-xs text-gray-500">{contact.bank}</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 -translate-x-2 group-hover:translate-x-0 transition-transform opacity-0 group-hover:opacity-100" />
                            </button>
                        ))}
                    </div>
                </>
            )}

            {step === 'amount' && (
                <div className="text-center py-8">
                    <p className="text-gray-400 text-sm mb-8">Transferindo para <strong className="text-white">{selectedContact?.name}</strong></p>
                    
                    <div className="relative mb-12">
                        <span className="text-2xl text-gray-500 absolute left-8 top-1/2 -translate-y-1/2">R$</span>
                        <input 
                            type="number" 
                            autoFocus
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-transparent text-5xl font-bold text-center text-white placeholder-gray-700 outline-none"
                            placeholder="0,00"
                        />
                    </div>

                    <button 
                        disabled={!amount}
                        onClick={() => setStep('confirm')}
                        className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all ${amount ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(8,145,178,0.4)]' : 'bg-white/5 text-gray-500'}`}
                    >
                        Continuar
                    </button>
                </div>
            )}

            {step === 'confirm' && (
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                        <span className="text-gray-400 text-sm">Valor</span>
                        <span className="text-2xl font-bold text-white">R$ {amount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Para</span>
                        <span className="text-white font-medium">{selectedContact?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Instituição</span>
                        <span className="text-white font-medium">{selectedContact?.bank}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Data</span>
                        <span className="text-white font-medium">Agora</span>
                    </div>

                    <button 
                        onClick={handleConfirm}
                        className="w-full py-4 mt-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white uppercase tracking-widest shadow-[0_0_20px_rgba(5,150,105,0.4)] flex items-center justify-center gap-2 transition-all"
                    >
                        <Smartphone className="w-5 h-5" />
                        Confirmar Pix
                    </button>
                </div>
            )}
        </div>
    );
};

export default PixModule;
