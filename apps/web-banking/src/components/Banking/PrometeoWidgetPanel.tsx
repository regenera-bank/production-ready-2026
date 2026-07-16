
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState } from 'react';
import { CheckCircle, ExternalLink, Loader2, Wallet } from 'lucide-react';
import { usePrometeoWidget } from '../../hooks/usePrometeoWidget';
import { fetchMonitoredPayment } from '../../platform/bff-client';
import { centsToDecimalString, parseMoneyInput } from '../../platform/money';

interface PrometeoWidgetPanelProps {
  accessToken: string;
  initialAmount?: string;
  initialConcept?: string;
}

const PrometeoWidgetPanel: React.FC<PrometeoWidgetPanelProps> = ({
  accessToken,
  initialAmount = '',
  initialConcept = '',
}) => {
  const {
    loading,
    error,
    lastPayment,
    widgetConfigured,
    openPayment,
    clearLastPayment,
  } = usePrometeoWidget(accessToken);

  const [amount, setAmount] = useState(initialAmount);
  const [concept, setConcept] = useState(
    initialConcept || `REGENERA-${Date.now().toString(36).toUpperCase()}`,
  );
  const [monitorStatus, setMonitorStatus] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (initialAmount) {
      setAmount(initialAmount);
    }
  }, [initialAmount]);

  useEffect(() => {
    const requestId = lastPayment?.requestId?.trim();
    if (!requestId) {
      return;
    }

    let attempts = 0;
    setPolling(true);
    setMonitorStatus('Aguardando confirmação no BFF (webhook + detalhe)...');

    const timer = window.setInterval(() => {
      attempts += 1;
      void fetchMonitoredPayment(accessToken, requestId)
        .then((result) => {
          if (!result.found || !result.item) {
            if (attempts >= 12) {
              setMonitorStatus(
                'Pagamento no widget — aguardando webhook Prometeo no BFF',
              );
              setPolling(false);
              window.clearInterval(timer);
            }
            return;
          }
          setMonitorStatus(
            `Monitorado: ${result.item.amount ?? '?'} ${result.item.currency ?? ''} · ${result.item.transferDetail?.status ?? result.item.status}`,
          );
          setPolling(false);
          window.clearInterval(timer);
        })
        .catch(() => {
          if (attempts >= 12) {
            setMonitorStatus('BFF ainda sem registro — configure webhook público');
            setPolling(false);
            window.clearInterval(timer);
          }
        });
    }, 2500);

    return () => window.clearInterval(timer);
  }, [accessToken, lastPayment?.requestId]);

  const handleOpen = () => {
    try {
      const cents = parseMoneyInput(amount);
      void openPayment({
        amount: centsToDecimalString(cents),
        currency: 'BRL',
        concept: (concept.trim() || 'Pagamento Regenera').slice(0, 20),
      });
    } catch {
      return;
    }
  };

  if (!widgetConfigured) {
    return (
      <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 text-xs text-amber-200 leading-relaxed">
        <p className="font-semibold mb-2">Widget Prometeo não configurado no BFF</p>
        <p>
          Crie o widget no dashboard Prometeo e defina{' '}
          <span className="font-mono text-amber-100">PROMETEO_WIDGET_ID</span>{' '}
          (product_id) em <span className="font-mono">bff/web-bff/.env</span>.
        </p>
        <p className="mt-2 text-amber-300/80">
          Webhook BFF: <span className="font-mono">POST /v1/prometeo/payments/webhook</span>
        </p>
      </div>
    );
  }

  if (lastPayment?.requestId) {
    return (
      <div className="space-y-4">
        <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-emerald-300">Pagamento no widget</p>
          <p className="text-xs text-gray-400 mt-2 font-mono break-all">
            requestId: {lastPayment.requestId}
          </p>
          {lastPayment.operationNumber && (
            <p className="text-xs text-gray-500 mt-1 font-mono">
              operação banco: {lastPayment.operationNumber}
            </p>
          )}
          {monitorStatus && (
            <p className="text-[10px] text-cyan-300/90 mt-3 leading-relaxed">
              {polling && <Loader2 className="w-3 h-3 inline animate-spin mr-1" />}
              {monitorStatus}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={clearLastPayment}
          className="w-full py-3 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-400"
        >
          Novo pagamento widget
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 text-xs text-cyan-100/90 leading-relaxed">
        <p className="font-semibold text-cyan-300 mb-1">Prometeo Payments API 2.0</p>
        <p>
          BFF cria <span className="font-mono">payment-intent</span> → widget{' '}
          <span className="font-mono">init(widgetId, intentId)</span> →{' '}
          <span className="font-mono">open({'{'} allowedFeatureLevel: 2 {'}'})</span>
        </p>
      </div>

      <div>
        <label className="block text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">
          Valor (BRL)
        </label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="10.00"
          inputMode="decimal"
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-lg font-bold focus:border-primary outline-none"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">
          Conceito / referência
        </label>
        <input
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleOpen}
        disabled={loading}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando widget...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            Abrir widget Prometeo
            <ExternalLink className="w-3 h-3 opacity-70" />
          </>
        )}
      </button>
    </div>
  );
};

export default PrometeoWidgetPanel;