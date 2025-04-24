import { Module } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { RutrackerTool } from './rutracker.tool';
import { RutrackerModule } from '../rutracker/rutracker.module';
import { ConfigModule } from '../config';
import { PlexTool } from './plex.tool';
import { PlexModule } from '../plex/plex.module';
import { TmdbModule } from '../tmdb/tmdb.module';
import { TmdbTool } from './tmdb.tool';

@Module({
  imports: [
    ConfigModule,
    McpModule.forRoot({
      name: 'rutracker-mcp-server',
      version: '1.0.0',
    }),
    RutrackerModule,
    PlexModule,
    TmdbModule,
  ],
  providers: [RutrackerTool, PlexTool, TmdbTool],
  exports: [McpModule],
})
export class McpServerModule {}
