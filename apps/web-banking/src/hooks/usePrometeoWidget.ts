import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createPrometeoPaymentIntent,
  fetchPrometeoWidgetConfig,
} from '../platform/bff-client';
import {
  createPrometeoWidget,
  prometeoMessaging,
} from '../platform/prometeo-widget';
import type {
  PrometeoPaymentResult,
  PrometeoWidgetInstance,
} from '../platform/prometeo-widget.types';

export interface PrometeoWidgetState {
  readonly ready: boolean;
  readonly loading: boolean;
  readonly error: string | null;
  readonly lastPayment: PrometeoPaymentResult | null;
  readonly widgetConfigured: boolean;
}

export interface OpenPrometeoPaymentInput {
  readonly amount: string;
  readonly currency?: string;
  readonly concept?: string;
  readonly reference?: string;
}

const bindWidgetListeners = (
  widget: PrometeoWidgetInstance,
  onPayment: (payment: PrometeoPaymentResult) => void,
  onError: (message: string) => void,
): void => {
  const messaging = prometeoMessaging();
  if (!messaging) {
    throw new Error('Prometeo.Messaging indisponível');
  }

  widget.on(messaging.CLOSE, () => undefined);

  widget.on(messaging.PAYMENT_SUCCESS, (payload) => {
    onPayment((payload ?? {}) as PrometeoPaymentResult);
  });

  widget.on(messaging.ERROR, (payload) => {
    const message =
      typeof payload === 'string'
        ? payload
        : payload instanceof Error
          ? payload.message
          : 'Erro no widget Prometeo';
    onError(message);
  });
};

export const usePrometeoWidget = (accessToken: string) => {
  const widgetRef = useRef<PrometeoWidgetInstance | null>(null);
  const [state, setState] = useState<PrometeoWidgetState>({
    ready: false,
    loading: false,
    error: null,
    lastPayment: null,
    widgetConfigured: false,
  });

  useEffect(() => {
    void fetchPrometeoWidgetConfig()
      .then((config) => {
        setState((prev) => ({
          ...prev,
          widgetConfigured: config.widgetConfigured,
        }));
      })
      .catch(() => {
        setState((prev) => ({ ...prev, widgetConfigured: false }));
      });
  }, []);

  const openPayment = useCallback(
    async (input: OpenPrometeoPaymentInput) => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        lastPayment: null,
      }));

      try {
        const intent = await createPrometeoPaymentIntent(accessToken, input);
        widgetRef.current?.close();

        const widget = await createPrometeoWidget(
          intent.widgetId,
          intent.intentId,
        );

        bindWidgetListeners(
          widget,
          (payment) => {
            setState((prev) => ({
              ...prev,
              lastPayment: payment,
              error: null,
            }));
          },
          (message) => {
            setState((prev) => ({ ...prev, error: message }));
          },
        );

        widgetRef.current = widget;
        widget.open({ allowedFeatureLevel: 2 });

        setState((prev) => ({
          ...prev,
          ready: true,
          loading: false,
          error: null,
        }));
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Falha ao abrir widget';
        setState((prev) => ({
          ...prev,
          ready: false,
          loading: false,
          error: message,
        }));
      }
    },
    [accessToken],
  );

  const clearLastPayment = useCallback(() => {
    setState((prev) => ({ ...prev, lastPayment: null, error: null }));
  }, []);

  useEffect(
    () => () => {
      widgetRef.current?.close();
      widgetRef.current = null;
    },
    [],
  );

  return {
    ...state,
    openPayment,
    clearLastPayment,
  };
};