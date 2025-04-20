import { Module } from '@nestjs/common';
import { RutrackerModule } from './rutracker/rutracker.module';

@Module({
  imports: [RutrackerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
