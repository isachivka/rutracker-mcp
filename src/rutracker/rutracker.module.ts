import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RutrackerService } from './rutracker.service';

@Module({
  imports: [ConfigModule],
  providers: [RutrackerService],
  exports: [RutrackerService],
})
export class RutrackerModule {}
