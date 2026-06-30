import { getAnalytics, isSupported } from 'firebase/analytics';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

function requirePublicConfig(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Configuração pública ausente: ${name}`);
  return value;
}

// Chave pública de SDK não é segredo. Ainda assim, ambiente não se grava no código.
const firebaseConfig = {
  apiKey: requirePublicConfig('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: requirePublicConfig('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: requirePublicConfig('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: requirePublicConfig('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requirePublicConfig('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requirePublicConfig('EXPO_PUBLIC_FIREBASE_APP_ID'),
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export async function analytics() {
  return (await isSupported()) ? getAnalytics(app) : null;
}

export default app;
