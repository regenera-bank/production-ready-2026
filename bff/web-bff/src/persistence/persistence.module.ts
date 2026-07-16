import { Global, Module } from '@nestjs/common';
import { ChannelPersistenceModule } from '@regenera/channel-persistence';

@Global()
@Module({
  imports: [ChannelPersistenceModule.forRoot()],
  exports: [ChannelPersistenceModule],
})
export class PersistenceModule {}