// ============================================================
// Resource: cyberquant://user/profile
// ============================================================

import type { URL } from 'node:url';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerState } from '../lib/state.js';

export function createUserProfileResource(server: McpServer, state: ServerState): void {
  server.resource(
    'user-profile',
    'cyberquant://user/profile',
    {
      description: '当前用户信息（等级、市场权限、到期时间、速率限制）',
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

      const res = await state.client.getProfile();
      if (!res.success || !res.data) {
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify({ error: res.error ?? '获取用户信息失败' }),
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
