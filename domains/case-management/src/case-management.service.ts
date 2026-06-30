import { Inject, Injectable } from '@nestjs/common';
import { CASE_MANAGEMENT_PORT, CaseManagementCommand, CaseManagementPort, CaseManagementResult } from './ports/case-management.port';

@Injectable()
export class CaseManagementService {
  constructor(@Inject(CASE_MANAGEMENT_PORT) private readonly port: CaseManagementPort) {}

  health() {
    return this.port.health();
  }

  execute(command: CaseManagementCommand): Promise<CaseManagementResult> {
    return this.port.execute(command);
  }
}
