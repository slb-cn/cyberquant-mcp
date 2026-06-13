// ============================================================
// cyberquant-mcp 类型定义
// ============================================================

/** MCP 专有配置 */
export interface McpConfig {
  pageSize: number;
  timeout: number;
}

/** 应用配置（共用 ~/.cyberquant/config.json） */
export interface AppConfig {
  endpoint: string;
  apiKey: string;
  mcp: McpConfig;
}

/** MCP 配置默认值 */
export const MCP_DEFAULTS: McpConfig = {
  pageSize: 200,
  timeout: 30000,
};

/** pageSize 上限 */
export const PAGE_SIZE_MAX = 1000;

// ---- API Gateway 响应类型 ----

export interface Pagination {
  nextCursor: string | null;
  hasMore: boolean;
  pageSize: number;
}

export interface ApiMeta {
  route?: string;
  count?: number;
  total?: number;
  pagination?: Pagination;
  userTier?: number;
  userMarkets?: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  meta?: ApiMeta;
}

// ---- 用户信息 ----

export interface UserProfile {
  email: string;
  tier: { level: number; name: string };
  markets: { code: string; name: string }[];
  expiresAt: string | null;
  isActive: boolean;
  rateLimit: { windowMs: number; maxRequests: number };
}

// ---- 路由列表 ----

export interface QueryParam {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  desc: string;
}

export interface ResponseParam {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  desc: string;
}

export interface RouteInfo {
  routeSlug: string;
  displayName: string;
  description: string;
  category: string;
  marketType: string;
  requiredTier: number;
  queryParams: QueryParam[];
  responseParams: ResponseParam[];
}

export interface RouteListMeta {
  total: number;
  userTier: number;
  userMarkets: string[];
}
