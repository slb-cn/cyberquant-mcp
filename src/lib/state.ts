// ============================================================
// 共享可变状态 —— Tools/Resources 通过此对象访问 ApiClient
// ============================================================

import type { AppConfig } from '../types/index.js';
import type { ApiClient } from './api-client.js';

export interface ServerState {
  config: AppConfig | null;
  client: ApiClient | null;
}

/** 无配置时的统一提示文案 */
export const NO_CONFIG_HINT =
  '未检测到 API Key 配置。请先调用 configure 工具，传入 apiKey 参数完成配置。endpoint 默认为 https://api.cyberspace2077.com，也可自定义。';
