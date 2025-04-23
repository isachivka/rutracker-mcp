import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlexService } from './plex.service';

@Module({
  imports: [ConfigModule],
  providers: [PlexService],
  exports: [PlexService],
})
export class PlexModule {}
