import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/foundation/firebase';
import { useStore } from '@/foundation/store';
import { api } from '@/platform/http/client';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuthenticated, setUser, showFeedback } = useStore();

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();
      
      // Store token (interceptor will also use auth.currentUser)
      sessionStorage.setItem('neural_token', token);
      
      setUser({
        id: cred.user.uid,
        neuralId: cred.user.uid,
        name: cred.user.displayName || email.split('@')[0],
        email: cred.user.email || email,
        tier: 'Standard',
      } as any);
      
      setAuthenticated(true);
      showFeedback('Bem-vindo ao Regenera', 'success');
      return cred.user;
    } catch (err: any) {
      const msg = mapError(err);
      setError(msg);
      showFeedback(msg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, cpf: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Verify CPF via Prometeo (Anti-fraud/Ghost account prevention)
      try {
        const cpfVerify = await api.url('/open-finance/connect').post({
          provider: 'openfinance_br',
          username: cpf,
        }).json<any>();
        
        if (!cpfVerify.key && cpfVerify.status !== 'success') {
          throw new Error('CPF não verificado via Open Finance');
        }
      } catch (e) {
        throw new Error('Falha na validação do CPF via Open Finance. Verifique se o CPF é válido.');
      }

      // 2. Create Firebase user
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      // 3. Update profile
      await updateProfile(cred.user, { displayName: name });
      
      const token = await cred.user.getIdToken();
      sessionStorage.setItem('neural_token', token);
      
      setUser({
        id: cred.user.uid,
        neuralId: cred.user.uid,
        name: name,
        email: email,
        cpf: cpf,
        tier: 'Standard',
      } as any);
      
      setAuthenticated(true);
      showFeedback('Conta criada com sucesso', 'success');
      return cred.user;
    } catch (err: any) {
      const msg = mapError(err);
      setError(msg);
      showFeedback(msg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      sessionStorage.removeItem('neural_token');
      setAuthenticated(false);
      setUser(null);
      showFeedback('Sessão encerrada', 'info');
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  return { login, signup, logout, loading, error };
};

const mapError = (err: any) => {
  const code = err?.code;
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está em uso.';
    case 'auth/weak-password':
      return 'Senha muito fraca (mínimo 8 caracteres).';
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    default:
      return err?.message || 'Ocorreu um erro inesperado.';
  }
};
