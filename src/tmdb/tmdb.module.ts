import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TmdbService } from './tmdb.service';

@Module({
  imports: [ConfigModule],
  providers: [TmdbService],
  exports: [TmdbService],
})
export class TmdbModule {}
