// [FILE] apps/services/card-service/src/card/payment-gateway.service.ts
import { Injectable } from '@nestjs/common';

/**
 * @author Don Paulo Ricardo
 * @description Serviço simulado de Gateway de Pagamento para tokenização de cartões.
 * Em um ambiente de produção, este módulo integraria com APIs PCI-DSS compliant
 * como Stripe, Adyen, etc.
 */
@Injectable()
export class PaymentGatewayService {
  /**
   * Simula a tokenização de dados de cartão.
   * @param cardNumber Número do cartão de crédito.
   * @param expMonth Mês de expiração.
   * @param expYear Ano de expiração.
   * @param cvc Código de segurança.
   * @param cardHolderName Nome do titular.
   * @returns Um objeto contendo o token do cartão, os últimos 4 dígitos e a bandeira.
   */
  async tokenizeCard(
    cardNumber: string,
    expMonth: string,
    expYear: string,
    cvc: string,
    cardHolderName: string,
  ): Promise<{ token: string; last4: string; brand: string; expirationDate: string }> {
    // Don Paulo: Em produção, isso seria uma chamada HTTP/gRPC para um provedor externo.
    // Para auditoria, garantimos que os dados sensíveis não permaneçam aqui.
    console.log(`[PaymentGatewayService] Tokenizando cartão: **** **** **** ${cardNumber.slice(-4)}`);

    // Geração de token simulada
    const simulatedToken = `tok_${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}`;
    const simulatedBrand = this.detectCardBrand(cardNumber);

    return {
      token: simulatedToken,
      last4: cardNumber.slice(-4),
      brand: simulatedBrand,
      expirationDate: `${expMonth}/${expYear}`,
    };
  }

  private detectCardBrand(cardNumber: string): string {
    // Don Paulo: Implementação simplificada. Provedores reais fazem isso de forma mais robusta.
    if (cardNumber.startsWith('4')) return 'Visa';
    if (cardNumber.startsWith('5')) return 'Mastercard';
    if (cardNumber.startsWith('34') || cardNumber.startsWith('37')) return 'American Express';
    return 'Unknown';
  }
}
