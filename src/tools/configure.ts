// ============================================================
// Tool: configure — 配置 API Key（首次使用时调用）
// ============================================================

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerState } from '../lib/state.js';
import { saveConfig, DEFAULT_ENDPOINT } from '../lib/config.js';
import { ApiClient } from '../lib/api-client.js';
import { MCP_DEFAULTS, PAGE_SIZE_MAX } from '../types/index.js';

/** 只读：当前配置状态文本（读取内存中的运行态，与各数据工具实际使用一致；不写文件、不回显 apiKey 值） */
export function formatConfigStatus(state: ServerState): string {
  const head = '当前配置状态（读取自内存，与各数据工具实际使用一致）：';
  const fileLine = '- 配置文件：~/.cyberquant/config.json';
  if (!state.config) {
    return [
      head,
      fileLine,
      '- API Key：未配置',
      '',
      '尚未配置，所有数据工具会返回未配置提示。请调用 configure 工具传入 apiKey 完成配置（endpoint 默认 https://api.cyberspace2077.com，pageSize 默认 200，均可省略）。',
    ].join('\n');
  }
  const c = state.config;
  return [
    head,
    fileLine,
    '- API Key：已配置',
    `- endpoint：${c.endpoint}`,
    `- pageSize：${c.mcp.pageSize}`,
    `- timeout：${c.mcp.timeout}ms`,
    '',
    '如需调整，调用 configure 并传入要修改的字段（apiKey 已配置时可省略；endpoint/pageSize 可选，省略则保留现有值）。',
  ].join('\n');
}

export function registerConfigureTool(server: McpServer, state: ServerState): void {
  server.tool(
    'configure',
    '配置 API Key 以访问数据服务，配置文件位于 ~/.cyberquant/config.json。不传任何参数时为「查询配置状态」（只读，返回是否已配置/endpoint/pageSize，不回显密钥、不写文件）；传入任意参数则为「写入配置」——apiKey 首次必填，配置文件已有 apiKey 时可省略（保留现有值）；endpoint 默认 https://api.cyberspace2077.com，通常无需传入；pageSize 可选（1~1000），省略则保留现有配置值。',
    {
      apiKey: z
        .string()
        .min(1)
        .optional()
        .describe('API Key，格式为 sk_live_xxx。首次配置必填；配置文件已有 apiKey 时可省略，保留现有值。'),
      endpoint: z
        .string()
        .optional()
        .describe(`API Gateway 地址，默认 ${DEFAULT_ENDPOINT}`),
      pageSize: z
        .number()
        .int()
        .min(1)
        .max(PAGE_SIZE_MAX)
        .optional()
        .describe(`单次查询返回条数，默认 ${MCP_DEFAULTS.pageSize}，上限 ${PAGE_SIZE_MAX}。省略则保留现有配置值。`),
    },
    async ({ apiKey, endpoint, pageSize }) => {
      // 零参 = 只读查询当前配置状态（不写文件、不回显密钥）
      if (apiKey === undefined && endpoint === undefined && pageSize === undefined) {
        return { content: [{ type: 'text' as const, text: formatConfigStatus(state) }] };
      }

      try {
        const config = saveConfig(apiKey, endpoint, pageSize);

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
              text: `配置成功！endpoint: ${config.endpoint}，pageSize: ${config.mcp.pageSize}，现在可以使用 list_routes 查看可用数据路由，或使用 query_data 查询数据。`,
            },
          ],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : '未知错误';
        return {
          content: [
            {
              type: 'text' as const,
              text: `配置失败：${msg}`,
            },
          ],
        };
      }
    },
  );
}
