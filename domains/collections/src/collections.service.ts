import { Inject, Injectable } from '@nestjs/common';
import { COLLECTIONS_PORT, CollectionsCommand, CollectionsPort, CollectionsResult } from './ports/collections.port';

@Injectable()
export class CollectionsService {
  constructor(@Inject(COLLECTIONS_PORT) private readonly port: CollectionsPort) {}

  health() {
    return this.port.health();
  }

  execute(command: CollectionsCommand): Promise<CollectionsResult> {
    return this.port.execute(command);
  }
}
