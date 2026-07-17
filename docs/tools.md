# 工具说明（MCP Tools）

MCP Server 提供七个工具（Tool），AI 可以主动调用这些工具来完成任务。

典型调用流程：`configure`（首次） → `list_routes`（找路由） → `get_route_detail`（看入参/返回） → `query_data`（取数据）。

---

## 1. configure — 配置 API Key

首次使用时必须调用此工具完成 API Key 配置。该工具有两种模式：**不传任何参数** = 只读查询当前配置状态；**传入任意参数** = 写入配置。

### 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `apiKey` | string | 首次 | API Key，格式为 `sk_live_xxx` 或 `sk_test_xxx`。配置文件已有 apiKey 时可省略，保留现有值 |
| `endpoint` | string | — | API Gateway 地址，默认 `https://api.cyberspace2077.com` |
| `pageSize` | number | — | 单次查询返回条数，默认 `200`，上限 `1000`（超出会被拒绝）。省略则保留现有配置值 |

### 查询配置状态（零参调用）

不传任何参数时为只读查询，返回当前运行态配置（与各数据工具实际使用一致），**不写文件、不回显 apiKey 值**：

**已配置时：**
```
当前配置状态（读取自内存，与各数据工具实际使用一致）：
- 配置文件：~/.cyberquant/config.json
- API Key：已配置
- endpoint：https://api.cyberspace2077.com
- pageSize：200
- timeout：30000ms
```

**未配置时：**
```
当前配置状态（读取自内存，与各数据工具实际使用一致）：
- 配置文件：~/.cyberquant/config.json
- API Key：未配置
```

> 💡 大模型在不确定是否已配置时，可先零参调用本工具探活，再决定是否需要传入 `apiKey`。

### 写入行为（传入任意参数时）

1. 将配置写入 `~/.cyberquant/config.json`（**按入参合并覆盖**：传入的参数覆盖原值，省略的参数保留原值，仅当原值也缺失时才回落默认值；同时保留 CLI 的 `pageSize`、`maxTerminalRecords` 等同级字段不被破坏）
2. **立即生效**：更新共享状态，后续所有工具调用直接使用新配置，无需重启

### 返回示例

**成功：**
```
配置成功！endpoint: https://api.cyberspace2077.com，pageSize: 200，现在可以使用 list_routes 查看可用数据路由，或使用 query_data 查询数据。
```

**失败：**
```
配置保存失败：EACCES: permission denied。请检查是否有写入 ~/.cyberquant/ 目录的权限。
```

### 何时使用

- 首次启动 MCP Server 时（无配置文件）
- 需要更换 API Key 时
- 需要切换环境（如从测试环境切换到生产环境）时
- 需要调整单次查询返回条数（`pageSize`）时

---

## 2. list_routes — 列出可用路由（仅目录）

列出当前用户可用的路由**目录级元信息**：`routeSlug`、显示名、说明、分类。**不含**入参/返回字段——避免上百个路由的全量参数一次性占满上下文。

### 参数

无参数。自动使用配置中的 API Key 获取对应用户权限下的路由列表。

### 调用接口

`GET /api/v1/api-list`（结果按账号按日缓存到 `~/.cyberquant/cache/routes-<hash>.json`，当天重复调用优先读取本地缓存；如需当日强制刷新可调用 `clear_routes_cache` 工具清除缓存）

### 返回示例

```
可用数据路由（共 32 个）：

【日K线数据】routeSlug: daily-stock
说明：股票日线行情数据，包含开盘价、收盘价、最高价、最低价、成交量等
分类：股票行情

【分钟线】routeSlug: minute-stock
说明：股票分钟级行情数据
分类：股票行情

...

以上为路由目录，**不含入参/返回字段详情**。
请按以下流程操作：
1. 调用 get_route_detail(routeSlug="...") 获取目标路由的查询参数与返回字段说明
2. 根据 get_route_detail 返回的参数说明与传值格式，自行组织 params 后调用 query_data 查询数据
```

### 何时使用

- 首次使用时浏览有哪些可用数据
- 不确定某类数据对应的 `routeSlug` 时

---

## 3. get_route_detail — 路由入参/返回字段详情

查询单个路由的完整入参与返回字段，并附通用传值格式指引；由大模型自行根据参数说明组织 `params` 调用 `query_data`（不提供调用模板，因实际查询参数千变万化，模板易误导）。

### 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `routeSlug` | string | ✅ | 路由标识，如 `"daily-stock"`，通过 `list_routes` 获取 |

### 返回示例

```
【日K线数据】routeSlug: daily-stock
说明：股票日线行情数据，包含开盘价、收盘价、最高价、最低价、成交量等
分类：股票行情

查询参数：
  - tradeDate (date, 可选): 交易日期，格式 YYYY-MM-DD
  - symbol (string, 可选): 股票代码，如 000001.SZ

返回字段：
  - tradeDate (string): 交易日期
  - symbol (string): 股票代码
  - close (number): 收盘价
  ...

通用传值格式（按参数 type）：
- string：单值传字符串 "v"；多值传字符串数组 ["v1","v2"]，或逗号分隔字符串 "v1,v2,v3"（≤100 项）
- number：单值传数字 1；多值传数字数组 [1,5,30]，或逗号分隔字符串 "1,5,30"（≤100 项）
- date：单值传字符串 "2026-05-01"；范围传两元素数组 ["2026-05-01","2026-05-07"]（语义 >= AND <=）
        支持格式：yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss

请根据上述查询参数说明与通用传值格式，结合用户实际意图（例如指定的代码、时间范围等）：
1. 自行判断需要传哪些参数（必填的务必带上，可选的按需）
2. 按各参数对应的 type 选择正确的传值形式（单值 / 多值 / 范围）
3. 调用 query_data(routeSlug, params) 获取数据
注：pageSize 由 mcp.pageSize 配置控制，不要写入 params。
```

### 何时使用

- `list_routes` 找到目标路由后，确认入参/返回字段
- 不确定某个参数怎么传（单值/多值/范围）时

---

## 4. query_data — 查询数据

查询指定路由的数据，结果以 **CSV 格式** 返回（节省 token）。

### 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `routeSlug` | string | ✅ | 路由标识，如 `"daily-stock"`，通过 `list_routes` 获取 |
| `params` | object | — | 查询参数，键值对透传给 API。具体参数参考 `get_route_detail` 返回的路由说明 |

`params` 的值支持以下类型：
- `string` — 字符串参数（如股票代码）
- `number` — 数值参数
- `boolean` — 布尔参数
- `string[]` / `number[]` — 数组参数（会展开为重复的查询参数）

### 调用接口

`GET /api/v1/data/:route_slug`

### 返回格式

**正常返回（CSV）：**
```
tradeDate,symbol,open,high,low,close,volume
2024-01-02,000001.SZ,12.35,12.58,12.30,12.50,15678900
2024-01-02,000002.SZ,8.10,8.25,8.05,8.20,23456700

本次查询返回 2 条数据。
```

**还有更多数据时：**
```
tradeDate,symbol,open,high,low,close,volume
2024-01-02,000001.SZ,12.35,12.58,12.30,12.50,15678900
...

本次查询返回 200 条数据。
⚠️ 当前查询范围下还有更多数据未返回。建议缩小查询参数范围（如缩小日期区间、指定具体代码等）以获取精确的数据子集，大模型更适合分析精准的小数据集。
```

**无数据：**
```
未查询到符合条件的数据。请检查查询参数是否正确，可通过 get_route_detail 工具查看该路由支持的参数说明。
```

**pageSize 超限：**
```
⚠️ 当前配置的单次查询数量为 1500 条，超过上限 1000 条。大模型不擅长直接在庞大的数值矩阵中做复杂的数学运算...
```

### 何时使用

- 需要查询具体的金融数据时
- 需要分析特定股票、特定时间段的行情数据时

### 数据量建议

AI 模型单次处理建议 **50-200 条记录**：
- 默认 `pageSize = 200`，适合大多数分析场景
- 超过 1000 条会被自动拦截
- 大数据量任务建议使用 `cyberquant-cli` 配合脚本处理

---

## 5. get_routes_metadata — 路由完整元数据

查询当前用户可访问的数据路由元数据列表，返回压缩 JSON。内容包含每个接口的 `routeSlug`、名称、说明、分类、市场类型、权限等级、查询参数 `queryParams` 与返回字段 `responseParams`，用于枚举可调用接口、选择 `routeSlug`，并理解各接口支持的筛选条件和返回字段定义。

### 参数

无参数。自动使用配置中的 API Key 获取对应用户权限下的路由元数据。

### 调用接口

`GET /api/v1/api-list`（结果按账号按日缓存到 `~/.cyberquant/cache/routes-<hash>.json`；可用 `clear_routes_cache` 工具主动清除）

### 返回示例

```json
[{"routeSlug":"daily-stock","displayName":"日K线数据","description":"股票日线行情数据","category":"股票行情","marketType":"stock","requiredTier":1,"queryParams":[{"name":"symbol","type":"string","required":false,"desc":"股票代码"}],"responseParams":[{"name":"tradeDate","type":"date","desc":"交易日期"}]}]
```

### 何时使用

- 需要一次性获取当前用户可查询数据范围的完整 Schema 时
- 需要程序化解析全部路由的查询参数和返回字段时
- 客户端无法稳定读取 MCP Resources，但仍需要完整元数据时

如果只是浏览有哪些数据，优先使用 `list_routes`；如果已确定具体 `routeSlug`，优先使用 `get_route_detail` 获取单路由详情以节省上下文。

---

## 6. get_user_profile — 用户账户与权限信息

查询当前 API Key 对应用户的账户与权限信息，返回压缩 JSON。内容包含用户邮箱、订阅等级、可用市场、到期时间、账户是否有效以及速率限制配置。

### 参数

无参数。自动使用配置中的 API Key 获取当前用户信息。

### 调用接口

`GET /api/v1/me`

### 返回示例

```json
{"email":"user@example.com","tier":{"level":2,"name":"专业版"},"markets":[{"code":"SH","name":"上海证券交易所"}],"expiresAt":"2025-12-31T23:59:59Z","isActive":true,"rateLimit":{"windowMs":60000,"maxRequests":120}}
```

### 何时使用

- 需要了解当前 API Key 的订阅等级、市场权限或账户有效期时
- 需要判断用户是否有权访问某类市场数据时
- 客户端无法稳定读取 MCP Resources，但仍需要用户权限上下文时

---

## 7. clear_routes_cache — 清除路由元数据缓存

清除本地路由元数据按日缓存文件 `~/.cyberquant/cache/routes-<hash>.json`。删除后，下次调用 `list_routes`、`get_routes_metadata` 或 `get_route_detail` 会从 API 重新拉取并重建当日缓存。

路由元数据按账号按日缓存（以文件 mtime 判断当日有效），正常情况下次日自动失效。当用户**当日**权限或可访问路由发生变动、而当日缓存尚未过期时，调用本工具强制刷新。

### 参数

无参数。清空目录下所有账号的路由元数据缓存文件（该目录仅存放按日 JSON 缓存）。不发起任何网络请求，不修改 `~/.cyberquant/config.json`。

### 行为

- 删除 `~/.cyberquant/cache/` 下所有 `routes-<hash>.json` 文件
- 返回已清除的缓存文件数量
- 不发起网络请求，不影响已配置的 API Key

### 返回示例

**已清除缓存：**
```
已清除 1 个路由元数据缓存文件。下次调用 list_routes / get_routes_metadata / get_route_detail 时会从 API 重新拉取并重建当日缓存。
```

**目录为空：**
```
缓存目录为空，没有需要清理的路由元数据缓存。下次调用 list_routes / get_routes_metadata / get_route_detail 时会从 API 重新拉取并重建当日缓存。
```

### 何时使用

- 用户当日权限/订阅等级变动后，路由列表未及时更新
- 怀疑本地路由元数据缓存与线上不一致，需要强制刷新当日缓存
- 故障排查时清除可能损坏的缓存文件
