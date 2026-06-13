// ============================================================
// 错误类型定义
// ============================================================

export class McpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'McpError';
  }
}

export class ConfigError extends McpError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class ApiError extends McpError {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** HTTP 状态码 → 中文错误消息 */
const ERROR_MESSAGES: Record<number, string> = {
  400: '参数校验失败',
  401: 'API Key 无效或已过期',
  403: '权限不足',
  404: '未找到 API 路由',
  429: '请求频率超限',
  500: '服务器内部错误',
  503: '服务暂不可用',
};

/** 将 HTTP 状态码映射为 ApiError */
export function mapApiError(status: number, detail?: string): ApiError {
  const base = ERROR_MESSAGES[status] ?? `请求失败 (${status})`;
  return new ApiError(status, detail ? `${base}: ${detail}` : base);
}
