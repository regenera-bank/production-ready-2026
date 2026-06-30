import { lookupCep as lookupCepViaBff } from './bff-client';

export interface CepAddress {
  postalCode: string;
  street: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export const formatCep = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

/** Consulta CEP via BFF → ViaCEP (não expõe integração no browser). */
export const lookupCep = async (cep: string): Promise<CepAddress | null> => {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) {
    return null;
  }
  try {
    const result = await lookupCepViaBff(digits);
    return {
      postalCode: result.postalCode,
      street: result.street,
      complement: result.complement,
      neighborhood: result.neighborhood,
      city: result.city,
      state: result.state,
    };
  } catch {
    return null;
  }
};