
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { Providers } from './app/providers';
import './index.css';
import '@/foundation/firebase'; // Autenticação precisa existir antes de qualquer rota protegida.

// StrictMode permanece ativo. Integrações devem ser idempotentes também durante o desenvolvimento.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>,
);
