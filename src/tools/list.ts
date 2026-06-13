// ============================================================
// Tool: list_routes — 列出可用路由及参数 Schema
// ============================================================

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerState } from '../lib/state.js';
import { NO_CONFIG_HINT } from '../lib/state.js';
import type { RouteInfo } from '../types/index.js';

/** 格式化单个路由为自然语言描述 */
function formatRoute(route: RouteInfo): string {
  const lines: string[] = [
    `【${route.displayName}】routeSlug: ${route.routeSlug}`,
    `说明：${route.description}`,
    `分类：${route.category}`,
  ];

  if (route.queryParams.length > 0) {
    lines.push('查询参数：');
    for (const p of route.queryParams) {
      const required = p.required ? '必填' : '可选';
      lines.push(`  - ${p.name} (${p.type}, ${required}): ${p.desc}`);
    }
  }

  if (route.responseParams.length > 0) {
    lines.push('返回字段：');
    for (const f of route.responseParams) {
      lines.push(`  - ${f.name} (${f.type}): ${f.desc}`);
    }
  }

  return lines.join('\n');
}

/** 通用参数传值格式说明（按参数 type，所有路由共用） */
const PARAM_FORMAT_GUIDE = [
  '通用传值格式（按参数 type）：',
  '- string：单值 key=v；多值用逗号 key=v1,v2,v3（≤100）或 URL 数组 key=v1&key=v2',
  '- number：单值 key=1；多值用逗号 key=1,5,30（≤100 项）',
  '- date：单值 key=yyyy-MM-dd；范围 key=d1&key=d2（>= AND <=）；同时支持 yyyy-MM-dd HH:mm:ss',
  '数组/范围请传 JS 数组，逗号分隔则传字符串。',
].join('\n');

export function registerListRoutesTool(server: McpServer, state: ServerState): void {
  server.tool(
    'list_routes',
    '列出当前用户可用的数据路由及其参数 Schema，包含每个路由的查询参数和返回字段说明',
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
        const guide = total > 0 ? `\n\n${PARAM_FORMAT_GUIDE}` : '';
        const footer = total > 0
          ? '\n\n使用 query_data 工具查询指定路由的数据，传入 routeSlug 和查询参数。'
          : '';

        return {
          content: [{ type: 'text' as const, text: header + body + guide + footer }],
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
