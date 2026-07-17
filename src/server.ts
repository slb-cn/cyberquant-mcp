// ============================================================
// MCP Server —— 注册 Tools + Resources
// ============================================================

import { createRequire } from 'node:module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerState } from './lib/state.js';

// ESM 下用 createRequire 加载 package.json，避免版本号与 package.json 漂移
const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string };
import { registerConfigureTool } from './tools/configure.js';
import { registerListRoutesTool } from './tools/list.js';
import { registerGetRouteDetailTool } from './tools/detail.js';
import { registerQueryDataTool } from './tools/query.js';
import { registerConfigInfoTools } from './tools/config-info.js';
import { registerClearRoutesCacheTool } from './tools/clear-routes-cache.js';
import { createUserProfileResource } from './resources/user-profile.js';
import { createRouteListResource } from './resources/route-list.js';

export function createServer(state: ServerState): McpServer {
  const server = new McpServer({
    name: 'cyberquant-mcp',
    version: pkg.version,
  });

  // 注册 Tools
  registerConfigureTool(server, state);
  registerListRoutesTool(server, state);
  registerGetRouteDetailTool(server, state);
  registerQueryDataTool(server, state);
  registerConfigInfoTools(server, state);
  registerClearRoutesCacheTool(server, state);

  // 注册 Resources
  createUserProfileResource(server, state);
  createRouteListResource(server, state);

  return server;
}
