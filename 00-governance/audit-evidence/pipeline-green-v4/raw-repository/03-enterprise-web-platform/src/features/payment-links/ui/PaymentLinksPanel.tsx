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

// |---------------------------------------------------------------------------------------|
// |  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
// |---------------------------------------------------------------------------------------|
//
// PROJECT:       Regenera Bank
// CEO:           Raphaela Cerveski
// DEVELOPER:     Don Paulo Ricardo
// ID:            2098233287
// COPYRIGHT:     Copyright (c) 2026 Regenera Corporate
//
// LICENSE:       EULA (End-User License Agreement)
// PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA
//
// WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
//                engenharia reversa ou modificação não autorizada.
//
// |---------------------------------------------------------------------------------------|
// |  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
// |---------------------------------------------------------------------------------------|

import React, { useState } from 'react';
import { CardGlass } from '../../../shared/ui/CardGlass';
import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';
import { api } from '../../../core/api/client';
import { Link, Copy, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../../shared/lib/utils';
import { CreatePaymentLinkRequestSchema, PaymentLinkResponse } from '../model/paymentLinksSchemas';

export const PaymentLinksPanel: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkData, setLinkData] = useState<PaymentLinkResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const parsedData = CreatePaymentLinkRequestSchema.parse({
        amount: parseFloat(amount),
        description: description || undefined
      });

      // Real call to backend (which uses Prometeo via SM key, no fake delay, isPending from await)
      const res = await api.url('/v1/payment-links').post(parsedData).json<any>();
      setLinkData(res);

    } catch (error) {
      console.error("Validation or API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (linkData?.url) {
      navigator.clipboard.writeText(linkData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <CardGlass className="w-full max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
          <Link className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="font-bold text-white tracking-widest uppercase text-sm">Links de Pagamento</h2>
          <p className="text-[10px] text-gray-500 uppercase">Powered by Prometeo API</p>
        </div>
      </div>

      {!linkData ? (
        <div className="space-y-4">
          <Input 
            type="number"
            label="Valor da Cobrança"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input 
            label="Descrição (Opcional)"
            placeholder="Ex: Consultoria Financeira"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button 
            className="w-full mt-2" 
            onClick={handleGenerate} 
            isLoading={loading}
            disabled={!amount || isNaN(parseFloat(amount))}
          >
            Gerar Link
          </Button>
        </div>
      ) : (
        <div className="animate-in fade-in zoom-in duration-300">
           <div className="p-4 bg-white/5 border border-white/10 rounded-xl mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Link Gerado</p>
              <p className="font-bold text-lg text-white mb-4">{formatCurrency(linkData.amount)}</p>
              
              <div className="flex items-center gap-2">
                <Input 
                  value={linkData.url} 
                  readOnly 
                  className="text-xs bg-black/50 text-gray-400" 
                />
                <Button variant="secondary" size="icon" onClick={copyToClipboard}>
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
           </div>
           <Button className="w-full" variant="ghost" onClick={() => { setLinkData(null); setAmount(''); setDescription(''); }}>
              Criar Nova Cobrança
           </Button>
        </div>
      )}
    </CardGlass>
  );
};
