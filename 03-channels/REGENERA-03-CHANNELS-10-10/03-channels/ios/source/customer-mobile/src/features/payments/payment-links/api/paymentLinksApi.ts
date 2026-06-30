
import { api } from '../../../../services/api';

export const createPaymentLink = async (amount: number, description?: string) => {
  try {
    const response = await api.post('/core/payment-links', { amount, description });
    return response.data;
  } catch (error) {
    console.error('[PAYMENT LINKS API ERROR]', error);
    throw new Error('Regenera Bank: Não foi possível gerar o link de pagamento.');
  }
};
