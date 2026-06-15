// ============================================================
// Tool: list_routes — 列出可用路由（仅目录级元信息，不含入参/返回字段）
// ============================================================

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerState } from '../lib/state.js';
import { NO_CONFIG_HINT } from '../lib/state.js';
import type { RouteInfo } from '../types/index.js';

/** 格式化单个路由为目录级条目（不渲染入参/返回字段） */
function formatRoute(route: RouteInfo): string {
  return [
    `【${route.displayName}】routeSlug: ${route.routeSlug}`,
    `说明：${route.description}`,
    `分类：${route.category}`,
  ].join('\n');
}

/** 列表后的引导：指向 get_route_detail */
const NEXT_STEP_HINT = [
  '以上为路由目录，**不含入参/返回字段详情**。',
  '请按以下流程操作：',
  '1. 调用 get_route_detail(routeSlug="...") 获取目标路由的查询参数与返回字段说明',
  '2. 根据 get_route_detail 返回的参数说明与传值格式，自行组织 params 后调用 query_data 查询数据',
].join('\n');

export function registerListRoutesTool(server: McpServer, state: ServerState): void {
  server.tool(
    'list_routes',
    '列出当前用户可用的数据路由目录（仅含 routeSlug、名称、说明、分类，不含入参/返回字段）。如需入参/返回字段详情，请使用 get_route_detail 工具。',
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
                text: `获取路由列表失败：${res.error ?? '未知错误'}。请检查 API Key 配置是否正确。`,
              },
            ],
          };
        }

        const routes = res.data;
        const total = res.meta?.total ?? routes.length;

        const header = `可用数据路由（共 ${total} 个）：\n`;
        const body = routes.map(formatRoute).join('\n\n');
        const footer = total > 0 ? `\n\n${NEXT_STEP_HINT}` : '';

        return {
          content: [{ type: 'text' as const, text: header + body + footer }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : '未知错误';
        return {
          content: [
            { type: 'text' as const, text: `获取路由列表失败：${msg}` },
          ],
        };
      }
    },
  );
}
