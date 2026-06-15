// ============================================================
// Tool: get_route_detail — 查询单个路由的入参/返回字段详情
// ============================================================

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerState } from '../lib/state.js';
import { NO_CONFIG_HINT } from '../lib/state.js';
import type { QueryParam, ResponseParam } from '../types/index.js';

/** 通用参数传值格式说明（按参数 type，所有路由共用） */
const PARAM_FORMAT_GUIDE = [
  '传值格式（按参数 type）：',
  '- string：单值传字符串 "v"；多值传字符串数组 ["v1","v2"]，或逗号分隔字符串 "v1,v2,v3"（≤100 项）',
  '- number：单值传数字 1；多值传数字数组 [1,5,30]，或逗号分隔字符串 "1,5,30"（≤100 项）',
  '- date：单值传字符串 "2026-05-01"；范围传两元素数组 ["2026-05-01","2026-05-07"]（语义 >= AND <=）',
  '        支持格式：yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss',
].join('\n');

/** 调用 query_data 的引导：让大模型自行分析需要传哪些参数 */
const CALL_HINT = [
  '请根据上述查询参数说明与通用传值格式，结合用户实际意图（例如指定的代码、时间范围等）：',
  '1. 自行判断需要传哪些参数（必填的务必带上，可选的按需）',
  '2. 按各参数对应的 type 选择正确的传值形式（单值 / 多值 / 范围）',
  '3. 调用 query_data(routeSlug, params) 获取数据',
  '注：pageSize 由 mcp.pageSize 配置控制，不要写入 params。',
].join('\n');

/** 渲染查询参数表 */
function formatQueryParams(params: QueryParam[]): string {
  if (params.length === 0) return '查询参数：（无）';
  const lines = ['查询参数：'];
  for (const p of params) {
    const required = p.required ? '必填' : '可选';
    lines.push(`  - ${p.name} (${p.type}, ${required}): ${p.desc}`);
  }
  return lines.join('\n');
}

/** 渲染返回字段表 */
function formatResponseParams(params: ResponseParam[]): string {
  if (params.length === 0) return '返回字段：（无）';
  const lines = ['返回字段：'];
  for (const f of params) {
    lines.push(`  - ${f.name} (${f.type}): ${f.desc}`);
  }
  return lines.join('\n');
}

export function registerGetRouteDetailTool(server: McpServer, state: ServerState): void {
  server.tool(
    'get_route_detail',
    '查询指定路由的入参与返回字段详情。先用 list_routes 找到 routeSlug，再用本工具拿参数说明，最后由大模型根据说明自行组织 params 调用 query_data。',
    {
      routeSlug: z.string().describe('路由标识，如 "daily-stock"。通过 list_routes 获取可用 routeSlug。'),
    },
    async ({ routeSlug }) => {
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
                text: `获取路由详情失败：${res.error ?? '未知错误'}。请检查 API Key 配置是否正确。`,
              },
            ],
          };
        }

        const route = res.data.find((r) => r.routeSlug === routeSlug);
        if (!route) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `未找到 routeSlug="${routeSlug}" 对应的路由。请调用 list_routes 工具确认 routeSlug 是否正确（注意大小写与连字符）。`,
              },
            ],
          };
        }

        const sections = [
          `【${route.displayName}】routeSlug: ${route.routeSlug}`,
          `说明：${route.description}`,
          `分类：${route.category}`,
          '',
          formatQueryParams(route.queryParams),
          '',
          formatResponseParams(route.responseParams),
          '',
          PARAM_FORMAT_GUIDE,
          '',
          CALL_HINT,
        ];

        return {
          content: [{ type: 'text' as const, text: sections.join('\n') }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : '未知错误';
        return {
          content: [
            { type: 'text' as const, text: `获取路由详情失败：${msg}` },
          ],
        };
      }
    },
  );
}
