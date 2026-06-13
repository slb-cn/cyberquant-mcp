// ============================================================
// API Gateway HTTP 客户端（含重试 + 超时）
// ============================================================

import type {
  AppConfig,
  ApiResponse,
  UserProfile,
  RouteInfo,
  RouteListMeta,
} from '../types/index.js';
import { mapApiError } from './errors.js';

export class ApiClient {
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor(config: AppConfig) {
    this.endpoint = config.endpoint;
    this.apiKey = config.apiKey;
    this.timeout = config.mcp.timeout;
  }

  /** 通用请求（含 429/503 重试） */
  private async request<T>(path: string): Promise<T> {
    const url = `${this.endpoint}${path}`;
    const maxRetries = 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Client-Type': 'mcp',
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (res.ok) {
        return (await res.json()) as T;
      }

      // 429 / 503 自动重试
      if ((res.status === 429 || res.status === 503) && attempt < maxRetries) {
        // 消耗响应体以避免 Socket 泄漏
        await res.body?.cancel().catch(() => {});
        const retryAfter = res.headers.get('Retry-After');
        const delay = retryAfter
          ? Number(retryAfter) * 1000
          : Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, Math.min(delay, 10000)));
        continue;
      }

      // 其他错误：提取错误详情
      let detail = '';
      try {
        const body = (await res.json()) as ApiResponse;
        detail = body.error ?? '';
      } catch {
        // JSON 解析失败，使用空详情
      }
      throw mapApiError(res.status, detail);
    }

    // 重试耗尽
    throw mapApiError(503, '重试次数已用完，请稍后再试');
  }

  /** 获取用户信息 */
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return this.request('/api/v1/me');
  }

  /** 获取可用路由列表 */
  async listRoutes(): Promise<ApiResponse<RouteInfo[]> & { meta?: RouteListMeta }> {
    return this.request('/api/v1/api-list');
  }

  /** 查询数据 */
  async queryData(
    routeSlug: string,
    params: Record<string, string | number | boolean | undefined | (string | number)[]>,
    pageSize: number,
  ): Promise<ApiResponse<Record<string, unknown>[]>> {
    const qs = new URLSearchParams();
    qs.set('pageSize', String(pageSize));

    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === '') continue;
      if (Array.isArray(v)) {
        for (const item of v) {
          if (item !== undefined && item !== '') qs.append(k, String(item));
        }
      } else {
        qs.set(k, String(v));
      }
    }

    const query = qs.toString();
    return this.request(`/api/v1/data/${routeSlug}${query ? '?' + query : ''}`);
  }
}
