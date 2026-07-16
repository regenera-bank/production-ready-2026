import type { PrometeoGlobal, PrometeoWidgetInstance } from './prometeo-widget.types';

export const PROMETEO_WIDGET_SDK_VERSION = '2.0.0';

const SCRIPT_URL = `https://cdn.prometeoapi.com/widget/${PROMETEO_WIDGET_SDK_VERSION}/init.js`;

let scriptPromise: Promise<void> | null = null;

export const loadPrometeoWidgetSdk = (): Promise<void> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Prometeo widget só roda no browser'));
  }

  const existing = document.querySelector<HTMLScriptElement>(
    `script[data-prometeo-widget="${PROMETEO_WIDGET_SDK_VERSION}"]`,
  );
  if (existing && window.Prometeo) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    document
      .querySelectorAll('script[data-prometeo-widget]')
      .forEach((node) => node.remove());

    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.dataset.prometeoWidget = PROMETEO_WIDGET_SDK_VERSION;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Falha ao carregar SDK Prometeo 2.0.0 (CDN)'));
    document.head.appendChild(script);
  });

  return scriptPromise;
};

export const createPrometeoWidget = async (
  widgetId: string,
  intentId: string,
): Promise<PrometeoWidgetInstance> => {
  await loadPrometeoWidgetSdk();
  const prometeo = window.Prometeo as PrometeoGlobal | undefined;
  if (!prometeo?.init) {
    throw new Error('SDK Prometeo 2.0 indisponível após carregar script');
  }
  return prometeo.init(widgetId, intentId);
};

export const prometeoMessaging = (): PrometeoGlobal['Messaging'] | undefined =>
  window.Prometeo?.Messaging;