import { registerRootComponent } from 'expo';

import App from './App';

// ============================================================================
// index.ts
// ============================================================================
//
// isso aqui é ignição.
//
// Expo Go entra por aqui.
// build nativo entra por aqui.
//
// não coloca segredo.
// não coloca token.
// não coloca Firebase.
// não coloca chamada HTTP.
// não coloca regra de negócio.
// não coloca gambiarra de ambiente.
//
// se esse arquivo virar depósito,
// o app nasce sujo antes da primeira tela.
//
// deixa pequeno.
// deixa óbvio.
// deixa quieto.
//
// ============================================================================

registerRootComponent(App);
