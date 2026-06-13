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

/** 保存配置并返回 AppConfig（用于 configure tool） */
export function saveConfig(apiKey: string, endpoint?: string): AppConfig {
  const config: RawConfig = {
    endpoint: (endpoint ?? DEFAULT_ENDPOINT).replace(/\/+$/, ''),
    apiKey,
    mcp: { ...MCP_DEFAULTS },
  };

  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');

  return {
    endpoint: config.endpoint!,
    apiKey: config.apiKey,
    mcp: { ...MCP_DEFAULTS },
  };
}
