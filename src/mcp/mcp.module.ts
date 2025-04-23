import { Module } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { RutrackerTool } from './rutracker.tool';
import { RutrackerModule } from '../rutracker/rutracker.module';
import { ConfigModule } from '../config';
import { PlexTool } from './plex.tool';
import { PlexModule } from '../plex/plex.module';

@Module({
  imports: [
    ConfigModule,
    McpModule.forRoot({
      name: 'rutracker-mcp-server',
      version: '1.0.0',
    }),
    RutrackerModule,
    PlexModule,
  ],
  providers: [RutrackerTool, PlexTool],
  exports: [McpModule],
})
export class McpServerModule {}
