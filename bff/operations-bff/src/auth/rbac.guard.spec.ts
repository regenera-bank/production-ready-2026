import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacGuard } from './rbac.guard';

describe('RbacGuard', () => {
  const reflector = new Reflector();
  const guard = new RbacGuard(reflector);

  function createContext(headers: Record<string, string>, permissions?: string[]): ExecutionContext {
    const handler = permissions ? () => undefined : () => undefined;
    if (permissions) {
      Reflect.defineMetadata('permissions', permissions, handler);
    }

    return {
      getHandler: () => handler,
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows public routes', () => {
    const handler = () => undefined;
    Reflect.defineMetadata('isPublic', true, handler);
    const context = {
      getHandler: () => handler,
      getClass: () => class {},
      switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows supervisor for ledger:read', () => {
    const context = createContext(
      { 'x-operator-id': 'op-1', 'x-operator-role': 'supervisor' },
      ['ledger:read'],
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies viewer for cases:manage', () => {
    const context = createContext(
      { 'x-operator-id': 'op-2', 'x-operator-role': 'viewer' },
      ['cases:manage'],
    );
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});