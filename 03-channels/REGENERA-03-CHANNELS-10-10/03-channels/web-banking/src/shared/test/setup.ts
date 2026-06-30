
import { expect, afterEach, beforeAll, afterAll } from "vitest";
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

expect.extend(matchers);

export const server = setupServer(...handlers);

// Silencia o barulho do React ErrorBoundary no ambiente de testes.
// O ErrorBoundary RE-LANÇA o erro via console.error conforme spec do React 18,
// mas o teste já valida a UI de fallback — o log é ruído puro.
const originalConsoleError = console.error;
console.error = (...args) => {
  const arg0 = args[0];
  if (typeof arg0 === 'string' && (
    arg0.includes('The above error occurred') ||
    arg0.includes('React will try to recreate') ||
    arg0.includes('Anomalia Neural detectada')
  )) return;

  if (arg0 instanceof Error && (
    arg0.message.includes('Generic crash') ||
    arg0.message.includes('Anomalia Neural detectada')
  )) return;

  // O próprio JSDOM envia um Error não capturado direto para a console:
  if (typeof arg0 === 'object' && arg0 !== null && String(arg0).includes('Generic crash')) {
    return;
  }

  originalConsoleError(...args);
};

beforeAll(() => server.listen());
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
