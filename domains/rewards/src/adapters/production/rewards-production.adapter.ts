import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  RewardsAdapterKind,
  RewardsCommand,
  RewardsHealth,
  RewardsPort,
  RewardsResult,
} from '../../ports/rewards.port';

@Injectable()
export class RewardsProductionAdapter implements RewardsPort {
  readonly kind: RewardsAdapterKind = 'production';

  async health(): Promise<RewardsHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('rewards', 'production');
  }

  async execute(_command: RewardsCommand): Promise<RewardsResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('rewards', 'production');
  }
}
