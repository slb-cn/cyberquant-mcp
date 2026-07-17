// ============================================================
// Tool: clear_routes_cache — 清除路由元数据按日文件缓存
// ============================================================

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerState } from '../lib/state.js';
import { NO_CONFIG_HINT } from '../lib/state.js';
import { clearAllDailyJsonCache } from '../lib/daily-cache.js';

const SUCCESS_HINT =
  '下次调用 list_routes / get_routes_metadata / get_route_detail 时会从 API 重新拉取并重建当日缓存。';

export function registerClearRoutesCacheTool(server: McpServer, state: ServerState): void {
  server.tool(
    'clear_routes_cache',
    '清除本地路由元数据按日缓存（~/.cyberquant/cache/routes-<hash>.json）。仅当用户当日权限/可访问路由发生变动、当日缓存未自动刷新时使用，强制下次查询重新从 API 拉取最新元数据。不发起网络请求。',
    {},
    async () => {
      if (!state.client) {
        return { content: [{ type: 'text' as const, text: NO_CONFIG_HINT }] };
      }

      try {
        const deleted = clearAllDailyJsonCache();
        const text =
          deleted > 0
            ? `已清除 ${deleted} 个路由元数据缓存文件。${SUCCESS_HINT}`
            : `缓存目录为空，没有需要清理的路由元数据缓存。${SUCCESS_HINT}`;
        return { content: [{ type: 'text' as const, text }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : '未知错误';
        return { content: [{ type: 'text' as const, text: `缓存清理失败：${msg}` }] };
      }
    },
  );
}
