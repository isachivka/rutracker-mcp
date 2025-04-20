import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RutrackerModule } from './rutracker/rutracker.module';

@Module({
  imports: [ConfigModule.forRoot(), RutrackerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
