// ============================================================
// cyberquant-mcp 入口 —— stdio 传输
// ============================================================

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './lib/config.js';
import { ApiClient } from './lib/api-client.js';
import type { ServerState } from './lib/state.js';
import { createServer } from './server.js';

async function main() {
  const config = loadConfig();

  const state: ServerState = {
    config,
    client: config ? new ApiClient(config) : null,
  };

  if (config) {
    process.stderr.write(
      `[cyberquant-mcp] 启动中... endpoint=${config.endpoint}, pageSize=${config.mcp.pageSize}, timeout=${config.mcp.timeout}\n`,
    );
  } else {
    process.stderr.write(
      '[cyberquant-mcp] 未检测到配置文件，请通过 configure 工具配置 API Key\n',
    );
  }

  const server = createServer(state);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stderr.write('[cyberquant-mcp] 已启动，通过 stdio 等待 MCP 连接\n');
}

main().catch((err) => {
  process.stderr.write(`[cyberquant-mcp] 启动失败：${err}\n`);
  process.exit(1);
});
