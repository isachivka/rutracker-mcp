import { Module } from '@nestjs/common';
import { RutrackerService } from './rutracker.service';

@Module({
  providers: [RutrackerService],
  exports: [RutrackerService],
})
export class RutrackerModule {}
