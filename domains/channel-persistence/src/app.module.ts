import { Module } from '@nestjs/common';
import { ChannelPersistenceModule } from './channel-persistence.module';

@Module({
  imports: [ChannelPersistenceModule.forRoot()],
})
export class AppModule {}