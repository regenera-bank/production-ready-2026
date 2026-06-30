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
// FIREBASE INFRASTRUCTURE MODULE

import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase Configuration
 * Nota: Em um ambiente de produção rigoroso, estes valores devem ser injetados 
 * via process.env (EXPO_PUBLIC_*) para facilitar a troca de ambientes (HML/PRD).
 */
const firebaseConfig = {
  apiKey: "AIza***REDACTED_FIREBASE_PUBLIC_KEY***",
  authDomain: "project-93b8df04-72ab-4e44-8a6.firebaseapp.com",
  projectId: "project-93b8df04-72ab-4e44-8a6",
  storageBucket: "project-93b8df04-72ab-4e44-8a6.firebasestorage.app",
  messagingSenderId: "520859662036",
  appId: "1:520859662036:web:5a8dfa982f4d068447ed41",
  measurementId: "G-PQK58EWL0H"
};

// Singleton Pattern para inicialização do Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exportando instâncias de serviços
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Inicializa Analytics de forma segura.
 * No React Native/Web, o Analytics pode não ser suportado em todos os ambientes (ex: SSR ou certos emuladores).
 */
export const analytics = async () => {
  if (await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export default app;
