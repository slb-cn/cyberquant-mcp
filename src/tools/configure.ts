// ============================================================
// Tool: configure — 配置 API Key（首次使用时调用）
// ============================================================

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerState } from '../lib/state.js';
import { saveConfig, DEFAULT_ENDPOINT } from '../lib/config.js';
import { ApiClient } from '../lib/api-client.js';

export function registerConfigureTool(server: McpServer, state: ServerState): void {
  server.tool(
    'configure',
    '配置 API Key 以访问数据服务。首次使用时必须调用此工具完成配置。endpoint 默认为 https://api.cyberspace2077.com。',
    {
      apiKey: z.string().describe('API Key，格式为 sk_live_xxx 或 sk_test_xxx'),
      endpoint: z
        .string()
        .optional()
        .describe(`API Gateway 地址，默认 ${DEFAULT_ENDPOINT}`),
    },
    async ({ apiKey, endpoint }) => {
      try {
        const config = saveConfig(apiKey, endpoint);

        // 更新共享状态，后续调用立即可用
        state.config = config;
        state.client = new ApiClient(config);

        process.stderr.write(
          `[cyberquant-mcp] 配置已更新：endpoint=${config.endpoint}, pageSize=${config.mcp.pageSize}\n`,
        );

        return {
          content: [
            {
              type: 'text' as const,
              text: `配置成功！endpoint: ${config.endpoint}，现在可以使用 list_routes 查看可用数据路由，或使用 query_data 查询数据。`,
            },
          ],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : '未知错误';
        return {
          content: [
            {
              type: 'text' as const,
              text: `配置保存失败：${msg}。请检查是否有写入 ~/.cyberquant/ 目录的权限。`,
            },
          ],
        };
      }
    },
  );
}
