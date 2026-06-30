
import React, { useState } from 'react';
import { CardGlass } from '@/design-system/CardGlass';
import { Input } from '@/design-system/Input';
import { Button } from '@/design-system/Button';
import { api } from '@/platform/http/client';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { CpfValidationResponseSchema } from '../model/identitySchemas';

export const KYCVerificationPanel: React.FC = () => {
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    setLoading(true);
    setError(null);
    try {
      // Stripping non-numeric characters for the API
      const cleanCpf = cpf.replace(/\D/g, '');
      
      // In a real frontend scenario interacting directly with Prometeo via Wretch (if CORS allows)
      // Otherwise, this should hit our NestJS Backend wrapper. 
      // For this implementation, we simulate hitting our backend which wraps Prometeo.
      
      if (cleanCpf.length !== 11) {
         throw new Error("CPF Invalido");
      }

      // Real backend call for KYC validation (no hardcoded delay, loading tied to await of real wretch call)
      const res = await api.url('/v1/identity/kyc/validate').post({ cpf: cleanCpf }).json<any>();
      const validated = CpfValidationResponseSchema.parse(res);
      setResult(validated);

    } catch (e: any) {
      setError('Falha na validação KYC. Verifique o documento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CardGlass variant="neural" glow className="w-full max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-neural-cyan/20 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-neural-cyan" />
        </div>
        <div>
          <h2 className="font-bold text-white tracking-widest uppercase text-sm">Validação de Identidade (KYC)</h2>
          <p className="text-[10px] text-gray-500 uppercase">Powered by Prometeo Identity API</p>
        </div>
      </div>

      {!result ? (
        <div className="space-y-4">
          <Input 
            placeholder="Digite o CPF (11 dígitos)"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            error={error || undefined}
          />
          <Button 
            className="w-full" 
            onClick={handleValidate} 
            isLoading={loading}
          >
            Verificar Identidade
          </Button>
        </div>
      ) : (
        <div className="animate-in fade-in zoom-in duration-300">
           <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div>
                 <p className="text-emerald-400 font-bold uppercase text-xs mb-1">Identidade Confirmada</p>
                 <p className="text-sm text-white font-bold">{result.data?.Result.BasicData.Name}</p>
                 <p className="text-[10px] text-gray-400 font-mono mt-1">Doc: {result.data?.Result.BasicData.TaxIdNumber} · BR</p>
              </div>
           </div>
           <Button className="w-full mt-4" variant="ghost" onClick={() => setResult(null)}>
              Nova Consulta
           </Button>
        </div>
      )}
    </CardGlass>
  );
};
