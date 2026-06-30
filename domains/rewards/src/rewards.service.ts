import { Inject, Injectable } from '@nestjs/common';
import { REWARDS_PORT, RewardsCommand, RewardsPort, RewardsResult } from './ports/rewards.port';

@Injectable()
export class RewardsService {
  constructor(@Inject(REWARDS_PORT) private readonly port: RewardsPort) {}

  health() {
    return this.port.health();
  }

  execute(command: RewardsCommand): Promise<RewardsResult> {
    return this.port.execute(command);
  }
}
