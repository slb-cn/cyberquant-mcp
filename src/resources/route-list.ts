// ============================================================
// Resource: cyberquant://routes
// ============================================================

import type { URL } from 'node:url';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerState } from '../lib/state.js';

export function createRouteListResource(server: McpServer, state: ServerState): void {
  server.resource(
    'routes',
    'cyberquant://routes',
    {
      description: '当前用户可用的数据路由列表',
      mimeType: 'application/json',
    },
    async (uri: URL) => {
      if (!state.client) {
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify({
                error: '未检测到 API Key 配置，请先调用 configure 工具完成配置。',
              }),
            },
          ],
        };
      }

      const res = await state.client.listRoutes();
      if (!res.success || !res.data) {
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify({ error: res.error ?? '获取路由列表失败' }),
            },
          ],
        };
      }
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(res.data, null, 2),
          },
        ],
      };
    },
  );
}
