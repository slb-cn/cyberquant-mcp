// ============================================================
// Tools: 配置查询 —— 元数据配置 + 用户配置
// ============================================================

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerState } from '../lib/state.js';
import { NO_CONFIG_HINT } from '../lib/state.js';

export function registerConfigInfoTools(server: McpServer, state: ServerState): void {
  server.tool(
    'get_routes_metadata',
    '一次性返回所有路由的完整元数据（压缩 JSON，含 routeSlug、名称、说明、分类、市场类型、权限等级、queryParams、responseParams）。token 开销较大，仅当需要一次性拿到全部接口的完整字段定义、构建完整索引时使用。',
    {},
    async () => {
      if (!state.client) {
        return { content: [{ type: 'text' as const, text: NO_CONFIG_HINT }] };
      }

      try {
        const res = await state.client.listRoutes();

        if (!res.success || !res.data) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `获取元数据配置失败：${res.error ?? '未知错误'}。请检查 API Key 配置是否正确。`,
              },
            ],
          };
        }

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(res.data) }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : '未知错误';
        return {
          content: [
            { type: 'text' as const, text: `获取元数据配置失败：${msg}` },
          ],
        };
      }
    },
  );

  server.tool(
    'get_user_profile',
    '查询当前 API Key 的账户与权限信息（压缩 JSON）：邮箱、订阅等级、可用市场、到期时间、账户是否有效、速率限制配置。仅在需要核对账户状态、可用市场范围或查看限流配额时调用。',
    {},
    async () => {
      if (!state.client) {
        return { content: [{ type: 'text' as const, text: NO_CONFIG_HINT }] };
      }

      try {
        const res = await state.client.getProfile();

        if (!res.success || !res.data) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `获取用户配置失败：${res.error ?? '未知错误'}。请检查 API Key 配置是否正确。`,
              },
            ],
          };
        }

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(res.data) }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : '未知错误';
        return {
          content: [
            { type: 'text' as const, text: `获取用户配置失败：${msg}` },
          ],
        };
      }
    },
  );
}
