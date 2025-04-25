import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RutrackerModule } from './rutracker/rutracker.module';
import { McpServerModule } from './mcp/mcp.module';
import { TmdbModule } from './tmdb/tmdb.module';
import { PlexModule } from './plex/plex.module';

@Module({
  imports: [ConfigModule.forRoot(), RutrackerModule, McpServerModule, TmdbModule, PlexModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
