import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  CaseManagementAdapterKind,
  CaseManagementCommand,
  CaseManagementHealth,
  CaseManagementPort,
  CaseManagementResult,
} from '../../ports/case-management.port';

@Injectable()
export class CaseManagementProductionAdapter implements CaseManagementPort {
  readonly kind: CaseManagementAdapterKind = 'production';

  async health(): Promise<CaseManagementHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('case-management', 'production');
  }

  async execute(_command: CaseManagementCommand): Promise<CaseManagementResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('case-management', 'production');
  }
}
