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

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase Web Client Config (PUBLIC - required for browser SDK / Identity Toolkit)
// This is the web app's apiKey (safe to bundle). 
// The actual server-side Firebase config and GEMINI_API_KEY live in Secret Manager
// and are injected into Cloud Run as FIREBASE_* and GEMINI_API_KEY env vars
// via the gcloud --set-secrets command the user provided.
const firebaseConfig = {
  apiKey: "AIza***REDACTED_FIREBASE_PUBLIC_KEY***",
  authDomain: "project-93b8df04-72ab-4e44-8a6.firebaseapp.com",
  projectId: "project-93b8df04-72ab-4e44-8a6",
  storageBucket: "project-93b8df04-72ab-4e44-8a6.firebasestorage.app",
  messagingSenderId: "520859662036",
  appId: "1:520859662036:web:5a8dfa982f4d068447ed41",
  measurementId: "G-PQK58EWL0H"
};

// Initialize Firebase for Web (safe singleton)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

export const initAnalytics = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export default app;
