import { useCallback, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  BffError,
  createFirebaseSession,
  registerFirebaseAccount,
  RegisterProfile,
  SessionResponse,
} from '../platform/bff-client';
import { auth, isFirebaseConfigured } from '../services/firebase';

const mapFirebaseError = (err: unknown): string => {
  const code = (err as { code?: string })?.code;
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está em uso.';
    case 'auth/weak-password':
      return 'Senha muito fraca (mínimo 6 caracteres).';
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/quota-exceeded':
      return 'Cota Firebase excedida — use login com CPF e senha.';
    default:
      return err instanceof Error ? err.message : 'Falha na autenticação Firebase';
  }
};

export const useFirebaseAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase não configurado — preencha VITE_FIREBASE_*');
    }
    setLoading(true);
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await cred.user.getIdToken();
      const session = await createFirebaseSession(idToken);
      return session;
    } catch (err) {
      if (err instanceof BffError) {
        setError(err.message);
        throw err;
      }
      const message = mapFirebaseError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, profile: RegisterProfile) => {
      if (!auth) {
        throw new Error('Firebase não configurado — preencha VITE_FIREBASE_*');
      }
      setLoading(true);
      setError(null);
      try {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        await updateProfile(cred.user, {
          displayName: (profile.displayName ?? email.split('@')[0] ?? 'Usuário').trim(),
        });
        const idToken = await cred.user.getIdToken();
        const session = await registerFirebaseAccount(idToken, profile);
        return session;
      } catch (err) {
        if (err instanceof BffError) {
          setError(err.message);
          throw err;
        }
        const message = mapFirebaseError(err);
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const loginWithGoogle = useCallback(async () => {
    if (!auth) {
      throw new Error('Firebase não configurado — preencha VITE_FIREBASE_*');
    }
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken();
      const session = await createFirebaseSession(idToken);
      return session;
    } catch (err) {
      if (err instanceof BffError) {
        setError(err.message);
        throw err;
      }
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') {
        throw new Error('Login com Google cancelado.');
      }
      const message = mapFirebaseError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (auth) {
      await signOut(auth);
    }
  }, []);

  const refreshIdToken = useCallback(async (): Promise<string | null> => {
    if (!auth?.currentUser) {
      return null;
    }
    return auth.currentUser.getIdToken(true);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    if (!auth) {
      throw new Error('Firebase não configurado — preencha VITE_FIREBASE_*');
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return {
        acknowledged: true,
        message:
          'Se o e-mail estiver cadastrado, enviaremos instruções de recuperação.',
      };
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        return {
          acknowledged: true,
          message:
            'Se o e-mail estiver cadastrado, enviaremos instruções de recuperação.',
        };
      }
      const message = mapFirebaseError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    enabled: isFirebaseConfigured(),
    login,
    loginWithGoogle,
    register,
    logout,
    refreshIdToken,
    requestPasswordReset,
    loading,
    error,
  };
};

export type FirebaseAuthResult = SessionResponse;