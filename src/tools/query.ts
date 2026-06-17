// ============================================================
// Tool: query_data — 数据查询（CSV 格式输出）
// ============================================================

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerState } from '../lib/state.js';
import { NO_CONFIG_HINT } from '../lib/state.js';
import { PAGE_SIZE_MAX } from '../types/index.js';

/** 将 JSON 数组转为 CSV 字符串（表头取首条数据字段名） */
function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const headerLine = headers.join(',');
  const dataLines = rows.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        // CSV 转义：含逗号、引号、换行时用双引号包裹
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(','),
  );
  return [headerLine, ...dataLines].join('\n');
}

/** pageSize 超限警告 */
const PAGE_SIZE_WARNING = (n: number) =>
  `⚠️ 当前配置的单次查询数量为 ${n} 条，超过上限 ${PAGE_SIZE_MAX} 条。大模型不擅长直接在庞大的数值矩阵中做复杂的数学运算（如精确计算长期均线、RSI、布林带等），建议：
1. 将 mcp.pageSize 调整为 ${PAGE_SIZE_MAX} 以内（推荐 200）
2. 使用编程脚本（Python/Node.js）配合 cyberquant-cli 处理大数据量任务
3. 缩小查询参数范围，获取更精准的数据子集`;

/** hasMore 提示 */
const HAS_MORE_HINT =
  '⚠️ 当前查询范围下还有更多数据未返回。建议缩小查询参数范围（如缩小日期区间、指定具体代码等）以获取精确的数据子集，大模型更适合分析精准的小数据集。';

/** 无数据提示 */
const NO_DATA_HINT =
  '未查询到符合条件的数据。请检查查询参数是否正确，可通过 get_route_detail 工具查看该路由支持的参数说明。';

export function registerQueryDataTool(server: McpServer, state: ServerState): void {
  server.tool(
    'query_data',
    '按参数查询指定路由的数据，返回 CSV 格式。需先用 `get_route_detail` 获取入参/返回字段说明，再据此组织 params 调用本工具。',
    {
      routeSlug: z.string().describe('路由标识，如 "daily-stock"。通过 list_routes 获取可用路由。'),
      params: z
        .record(z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()]))]))
        .optional()
        .describe('查询参数，键值对透传给 API。具体参数与传值格式请先调用 get_route_detail(routeSlug) 获取，再据此组织本对象。'),
    },
    async ({ routeSlug, params }) => {
      if (!state.client || !state.config) {
        return { content: [{ type: 'text' as const, text: NO_CONFIG_HINT }] };
      }

      const pageSize = state.config.mcp.pageSize;

      // 前置校验：pageSize 上限拦截
      if (pageSize > PAGE_SIZE_MAX) {
        return {
          content: [{ type: 'text' as const, text: PAGE_SIZE_WARNING(pageSize) }],
        };
      }

      try {
        const res = await state.client.queryData(routeSlug, params ?? {}, pageSize);

        if (!res.success) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `查询失败：${res.error ?? '未知错误'}。请检查路由标识和参数是否正确。`,
              },
            ],
          };
        }

        const rows = res.data;
        const count = res.meta?.count ?? (Array.isArray(rows) ? rows.length : 0);
        const hasMore = res.meta?.pagination?.hasMore ?? false;

        // 无数据
        if (!Array.isArray(rows) || rows.length === 0) {
          return {
            content: [{ type: 'text' as const, text: NO_DATA_HINT }],
          };
        }

        // 拼接结果：CSV + 统计 + 引导
        const parts: string[] = [toCsv(rows), '', `本次查询返回 ${count} 条数据。`];
        if (hasMore) {
          parts.push(HAS_MORE_HINT);
        }

        return {
          content: [{ type: 'text' as const, text: parts.join('\n') }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : '未知错误';
        return {
          content: [{ type: 'text' as const, text: `查询失败：${msg}` }],
        };
      }
    },
  );
}
