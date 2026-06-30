
import { api } from '../../../services/api';
import { CpfPayload, CpfBasicData } from '../model/kyc';

export const validateCpfIdentity = async (data: CpfPayload): Promise<CpfBasicData> => {
  try {
    // Chamada POST para o backend NestJS, que envelopa a API Prometeo.
    // Usamos o backend para não expor a chave de API da Prometeo no app Mobile.
    const response = await api.post('/compliance/validate-cpf', data);
    
    // Extraímos os dados se a consulta for bem-sucedida
    if (response?.data?.Result?.BasicData) {
      return response.data.Result.BasicData;
    }
    
    throw new Error('Identidade não confirmada.');
  } catch (error) {
    // Escudo de Marca: Traduzimos erros técnicos para mensagens amigáveis do Regenera.
    console.error('[KYC API ERROR]', error);
    throw new Error('Regenera Bank: Não foi possível validar este documento no momento.');
  }
};
