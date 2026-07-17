# Resources 说明（MCP Resources）

MCP Resources 是一种被动数据源，AI 客户端可以读取资源内容，无需调用工具。

## Resources vs Tools

| 特性 | Tools | Resources |
|------|-------|-----------|
| 触发方式 | AI 主动调用 | AI 读取资源内容 |
| 是否有参数 | 有 | 无 |
| 是否有副作用 | `configure` 有副作用 | 无（只读） |
| 返回格式 | 自定义文本（CSV/提示） | JSON |
| 典型用途 | 查询数据、修改配置 | 获取上下文信息 |

简单来说：
- **Tools** 是"动作"—— AI 需要执行某个操作时调用
- **Resources** 是"信息"—— AI 需要了解某方面信息时读取

---

## 1. cyberquant://user/profile

当前登录用户的信息。若 MCP 客户端无法稳定读取 Resource，也可调用 `get_user_profile` 工具获取同等用户账户与权限信息。

### MIME 类型

`application/json`

### 描述

当前用户信息（等级、市场权限、到期时间、速率限制）

### 返回字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `email` | string | 用户邮箱 |
| `tier.level` | number | 用户等级编号 |
| `tier.name` | string | 用户等级名称 |
| `markets` | array | 可用市场列表 |
| `markets[].code` | string | 市场代码 |
| `markets[].name` | string | 市场名称 |
| `expiresAt` | string | 到期时间 |
| `isActive` | boolean | 是否有效 |
| `rateLimit.windowMs` | number | 速率限制时间窗口（毫秒） |
| `rateLimit.maxRequests` | number | 时间窗口内最大请求数 |

### 返回示例

```json
{
  "email": "user@example.com",
  "tier": {
    "level": 2,
    "name": "专业版"
  },
  "markets": [
    { "code": "SH", "name": "上海证券交易所" },
    { "code": "SZ", "name": "深圳证券交易所" }
  ],
  "expiresAt": "2025-12-31T23:59:59Z",
  "isActive": true,
  "rateLimit": {
    "windowMs": 60000,
    "maxRequests": 120
  }
}
```

### 调用接口

`GET /api/v1/me`

### 更新策略

每次访问时从 API 获取最新用户信息，不做文件缓存。

### 何时使用

- AI 需要了解用户权限范围时
- 需要判断用户是否有权访问某个市场时
- 需要检查账户有效期时

---

## 2. cyberquant://routes

当前用户可用的数据路由列表。若 MCP 客户端无法稳定读取 Resource，也可调用 `get_routes_metadata` 工具获取同等完整路由元数据。

### MIME 类型

`application/json`

### 描述

当前用户可用的数据路由列表

### 调用接口

`GET /api/v1/api-list`

### 更新策略

路由元数据按账号按日缓存到 `~/.cyberquant/cache/routes-<hash>.json`。缓存文件修改时间晚于当天 00:00 时直接读取本地缓存；文件不存在、过期或损坏时重新调用 API 并刷新缓存。如需当日主动刷新（如权限变动后当日缓存未更新），可调用 `clear_routes_cache` 工具清除缓存文件。

### 与 list_routes / get_route_detail 工具的区别

| 特性 | `cyberquant://routes` Resource | `get_routes_metadata` Tool | `list_routes` Tool | `get_route_detail` Tool |
|------|------|------|------|------|
| 数据来源 | 相同（`GET /api/v1/api-list`） | 相同 | 相同 | 相同 |
| 返回格式 | 原始 JSON（含入参/返回字段） | 压缩 JSON（含入参/返回字段） | 格式化文本（仅目录） | 格式化文本（含单路由完整字段+传值格式指引） |
| 用途 | 程序化读取完整 Schema | 通过 Tool 获取完整 Schema | AI 浏览路由目录 | AI 取单个路由的详情后自行组织 query_data 参数 |

Resource 与 `get_routes_metadata` 返回完整 JSON 数据，适合程序化处理；`list_routes` 与 `get_route_detail` 返回格式化的自然语言文本，按"先目录后详情"的顺序使用以节省上下文。

### 何时使用

- AI 需要程序化解析路由列表时
- 需要获取路由的完整 Schema 信息时
