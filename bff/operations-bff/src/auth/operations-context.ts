import { OperationsRoleName } from './roles';

export interface OperationsRequestContext {
  readonly operatorId: string;
  readonly role: OperationsRoleName;
  readonly permissions: readonly string[];
}