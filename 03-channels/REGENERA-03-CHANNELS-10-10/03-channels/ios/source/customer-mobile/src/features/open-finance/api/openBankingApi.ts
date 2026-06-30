
import { api } from '../../../services/api';

export const fetchOpenFinanceAccounts = async () => {
  try {
    const response = await api.get('/open-finance/banks');
    return response.data || [];
  } catch (error) {
    console.error('[OPEN FINANCE API ERROR]', error);
    throw new Error('Regenera Bank: Sincronização mTLS temporariamente indisponível.');
  }
};
