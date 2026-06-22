// ============================================================
// 配置管理 —— 共用 ~/.cyberquant/config.json
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { AppConfig, McpConfig } from '../types/index.js';
import { MCP_DEFAULTS, PAGE_SIZE_MAX } from '../types/index.js';

const CONFIG_DIR = path.join(os.homedir(), '.cyberquant');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/** 默认 API Gateway 端点 */
export const DEFAULT_ENDPOINT = 'https://api.cyberspace2077.com';

interface RawConfig {
  endpoint?: string;
  apiKey?: string;
  mcp?: Partial<McpConfig>;
}

/** 读取原始配置文件 */
function readRawConfig(): RawConfig | null {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return null;
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw) as RawConfig;
  } catch {
    // 配置文件格式错误，视为无配置
    return null;
  }
}

/** 自动补全 mcp 字段（缺失时写回文件） */
function ensureMcpField(raw: RawConfig): void {
  if (raw.mcp && raw.mcp.pageSize !== undefined && raw.mcp.timeout !== undefined) {
    return;
  }
  raw.mcp = { ...MCP_DEFAULTS, ...raw.mcp };
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(raw, null, 2), 'utf-8');
  } catch {
    // 写入失败不影响运行，使用默认值即可
  }
}

/** 从原始配置构建 AppConfig（不抛异常） */
function buildConfig(raw: RawConfig): AppConfig | null {
  if (!raw.endpoint || !raw.apiKey) return null;

  ensureMcpField(raw);

  const mcp: McpConfig = {
    pageSize: raw.mcp?.pageSize ?? MCP_DEFAULTS.pageSize,
    timeout: raw.mcp?.timeout ?? MCP_DEFAULTS.timeout,
  };

  if (mcp.pageSize > PAGE_SIZE_MAX) {
    process.stderr.write(
      `[cyberquant-mcp] 警告：mcp.pageSize=${mcp.pageSize} 超过上限 ${PAGE_SIZE_MAX}，查询时将返回警告提示\n`,
    );
  }

  return {
    endpoint: raw.endpoint.replace(/\/+$/, ''),
    apiKey: raw.apiKey,
    mcp,
  };
}

/** 加载配置，无配置或缺少必填字段时返回 null */
export function loadConfig(): AppConfig | null {
  const raw = readRawConfig();
  if (!raw) return null;
  return buildConfig(raw);
}

/** 保存配置并返回 AppConfig（用于 configure tool）
 *  合并语义：本次入参 > 配置文件现有值 > 默认值；保留配置文件中的其它字段（如 CLI 的 maxTerminalRecords）。
 *  apiKey 可选——省略时取配置文件现有值；两者皆无（首次未配置）则抛错，由工具层提示。 */
export function saveConfig(apiKey?: string, endpoint?: string, pageSize?: number): AppConfig {
  // 读取现有配置，保留 CLI 同级字段与已设的 apiKey/mcp.timeout
  const existing: RawConfig = readRawConfig() ?? {};

  // apiKey：本次入参 > 配置文件现有值；两者皆无则无法完成配置
  const finalApiKey = apiKey ?? existing.apiKey;
  if (!finalApiKey) {
    throw new Error('缺少 API Key：配置文件尚未配置 apiKey 且本次未传入，首次配置请提供 apiKey。');
  }

  const endpointValue = (endpoint ?? existing.endpoint ?? DEFAULT_ENDPOINT).replace(/\/+$/, '');
  const mcp: McpConfig = {
    pageSize: pageSize ?? existing.mcp?.pageSize ?? MCP_DEFAULTS.pageSize,
    timeout: existing.mcp?.timeout ?? MCP_DEFAULTS.timeout,
  };

  // 保留 existing 中的其它字段，仅覆盖 endpoint/apiKey/mcp
  const config: RawConfig = { ...existing, endpoint: endpointValue, apiKey: finalApiKey, mcp };

  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');

  // 入参 pageSize 已由工具层 zod 限制在 1~1000，此处仅可能因保留现有值而超限，与 buildConfig 行为一致
  if (mcp.pageSize > PAGE_SIZE_MAX) {
    process.stderr.write(
      `[cyberquant-mcp] 警告：mcp.pageSize=${mcp.pageSize} 超过上限 ${PAGE_SIZE_MAX}，查询时将返回警告提示\n`,
    );
  }

  return { endpoint: endpointValue, apiKey: finalApiKey, mcp };
}
