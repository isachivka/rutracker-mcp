import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RutrackerModule } from './rutracker/rutracker.module';
import { McpServerModule } from './mcp/mcp.module';

@Module({
  imports: [ConfigModule.forRoot(), RutrackerModule, McpServerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
