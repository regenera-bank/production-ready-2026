import { HttpStatus } from '@nestjs/common';
import {
  CORE_BANKING_DOMAIN,
  ConflictException,
  NotFoundException,
  StateTransitionException,
  ValidationException,
  isCoreBankingException,
} from './core-banking.errors';

describe('Core Banking errors (PR-02)', () => {
  describe('ValidationException', () => {
    it('retorna 400 com code e domain', () => {
      const err = new ValidationException('D ≠ C', 'LEDGER_IMBALANCE', {
        entryId: 'je-1',
      });
      expect(err.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(err.code).toBe('LEDGER_IMBALANCE');
      expect(err.getBody()).toEqual({
        message: 'D ≠ C',
        code: 'LEDGER_IMBALANCE',
        domain: CORE_BANKING_DOMAIN,
        details: { entryId: 'je-1' },
      });
    });
  });

  describe('ConflictException', () => {
    it('retorna 409 para drift de idempotência', () => {
      const err = new ConflictException(
        'Mesma chave, payload diferente',
        'IDEMPOTENCY_PAYLOAD_DRIFT',
      );
      expect(err.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(err.getBody().code).toBe('IDEMPOTENCY_PAYLOAD_DRIFT');
      expect(err.getBody().domain).toBe(CORE_BANKING_DOMAIN);
    });
  });

  describe('NotFoundException', () => {
    it('retorna 404 com referência auditável', () => {
      const err = new NotFoundException('Conta não encontrada', 'ACCOUNT_NOT_FOUND', {
        accountId: 'acc-99',
      });
      expect(err.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(err.getBody().details).toEqual({ accountId: 'acc-99' });
    });
  });

  describe('StateTransitionException', () => {
    it('retorna 422 para retry em UNKNOWN', () => {
      const err = new StateTransitionException(
        'UNKNOWN bloqueia retry automático',
        'PAYMENT_UNKNOWN_BLOCKED',
        { paymentId: 'pay-1', from: 'UNKNOWN', to: 'SENT' },
      );
      expect(err.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(err.code).toBe('PAYMENT_UNKNOWN_BLOCKED');
    });

    it('reversão de reversão → StateTransitionException', () => {
      const err = new StateTransitionException(
        'Lançamento já é reversão',
        'LEDGER_REVERSAL_OF_REVERSAL',
      );
      expect(err).toBeInstanceOf(StateTransitionException);
      expect(isCoreBankingException(err)).toBe(true);
    });
  });

  describe('isCoreBankingException', () => {
    it('identifica hierarquia do domínio', () => {
      expect(isCoreBankingException(new ValidationException('x', 'X'))).toBe(true);
      expect(isCoreBankingException(new ConflictException('x', 'X'))).toBe(true);
      expect(isCoreBankingException(new NotFoundException('x', 'X'))).toBe(true);
      expect(isCoreBankingException(new StateTransitionException('x', 'X'))).toBe(true);
      expect(isCoreBankingException(new Error('x'))).toBe(false);
    });
  });
});