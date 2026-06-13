// ============================================================
// MCP Server —— 注册 Tools + Resources
// ============================================================

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerState } from './lib/state.js';
import { registerConfigureTool } from './tools/configure.js';
import { registerListRoutesTool } from './tools/list.js';
import { registerQueryDataTool } from './tools/query.js';
import { createUserProfileResource } from './resources/user-profile.js';
import { createRouteListResource } from './resources/route-list.js';

export function createServer(state: ServerState): McpServer {
  const server = new McpServer({
    name: 'cyberquant-mcp',
    version: '0.1.0',
  });

  // 注册 Tools
  registerConfigureTool(server, state);
  registerListRoutesTool(server, state);
  registerQueryDataTool(server, state);

  // 注册 Resources
  createUserProfileResource(server, state);
  createRouteListResource(server, state);

  return server;
}
