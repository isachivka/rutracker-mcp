import { Module } from '@nestjs/common';
import { RutrackerModule } from './rutracker/rutracker.module';
import { ConfigModule } from './config';

@Module({
  imports: [ConfigModule, RutrackerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
