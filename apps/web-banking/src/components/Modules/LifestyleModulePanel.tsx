import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, ShoppingBag } from 'lucide-react';
import {
  centsToReais,
  executeLifestyleAction,
  fetchLifestyleActivation,
  fetchLifestyleCatalog,
  type LifestyleCatalogItemDto,
} from '../../platform/bff-client';
import { createIdempotencyKey } from '../../platform/money';
import SandboxBanner from '../UI/SandboxBanner';

interface LifestyleModulePanelProps {
  moduleId: string;
  moduleLabel: string;
  accessToken: string;
  /** Alinha com id HTML canônico (ex.: view-discounts). */
  viewTestId?: string;
}

const formatBrl = (cents: string) =>
  centsToReais(cents).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const LifestyleModulePanel: React.FC<LifestyleModulePanelProps> = ({
  moduleId,
  moduleLabel,
  accessToken,
  viewTestId,
}) => {
  const [items, setItems] = useState<LifestyleCatalogItemDto[]>([]);
  const [externalActive, setExternalActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) {
      setError('Sessão inválida');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [catalog, activation] = await Promise.all([
        fetchLifestyleCatalog(accessToken, moduleId),
        fetchLifestyleActivation(accessToken, moduleId),
      ]);
      setItems(catalog.items);
      setExternalActive(activation.externalProviderActive);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar catálogo');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, moduleId]);

  useEffect(() => {
    void load();
  }, [load]);

  const viewId = viewTestId ?? `view-${moduleId}`;

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center h-[40vh] gap-4"
        data-testid={viewId}
        data-view-state="loading"
      >
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
        <p className="text-xs text-gray-500 uppercase tracking-widest">
          Carregando {moduleLabel} do BFF
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center space-y-4" data-testid={viewId} data-view-state="error">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <p className="text-sm text-gray-400">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold uppercase tracking-widest"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div
      className="p-6 space-y-6 animate-in slide-in-from-right duration-500 pb-32"
      data-testid={viewId}
      data-view-state="ready"
    >
      <SandboxBanner
        label={`Sandbox lifestyle · GET /lifestyle/${moduleId}/catalog · parceiro ${
          externalActive ? 'ativo' : 'EXTERNAL_ACTIVATION pendente'
        }`}
      />

      <div className="flex items-center gap-3">
        <ShoppingBag className="w-6 h-6 text-cyan-400" />
        <h2 className="text-xl font-bold text-white">{moduleLabel}</h2>
      </div>

      {actionMsg && (
        <p className="text-xs text-center text-gray-400 border border-white/10 rounded-xl py-2 px-3">
          {actionMsg}
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Catálogo vazio no BFF.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-5"
              data-testid={`lifestyle-item-${item.id}`}
            >
              <p className="font-bold text-white text-sm mb-2">{item.name}</p>
              <p className="text-cyan-400 font-mono text-sm">{formatBrl(item.priceCents)}</p>
              {item.sandbox && (
                <span className="text-[9px] text-amber-400 uppercase tracking-widest mt-2 inline-block">
                  sandbox
                </span>
              )}
              <button
                type="button"
                disabled={actingId === item.id}
                onClick={() => {
                  setActingId(item.id);
                  setActionMsg(null);
                  void executeLifestyleAction(
                    accessToken,
                    moduleId,
                    'select_item',
                    { itemId: item.id },
                    createIdempotencyKey('lifestyle'),
                  )
                    .then((r) => setActionMsg(`Ação ${r.status} · ref ${r.referenceId.slice(0, 8)}`))
                    .catch((e) =>
                      setActionMsg(e instanceof Error ? e.message : 'Falha na ação lifestyle'),
                    )
                    .finally(() => setActingId(null));
                }}
                className="mt-3 w-full py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-widest text-cyan-300 disabled:opacity-50"
              >
                {actingId === item.id ? 'Enviando…' : 'Registrar intenção'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LifestyleModulePanel;