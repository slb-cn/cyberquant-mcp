# 工具说明（MCP Tools）

MCP Server 提供四个工具（Tool），AI 可以主动调用这些工具来完成任务。

典型调用流程：`configure`（首次） → `list_routes`（找路由） → `get_route_detail`（看入参/返回） → `query_data`（取数据）。

---

## 1. configure — 配置 API Key

首次使用时必须调用此工具完成 API Key 配置。

### 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `apiKey` | string | ✅ | API Key，格式为 `sk_live_xxx` 或 `sk_test_xxx` |
| `endpoint` | string | — | API Gateway 地址，默认 `https://api.cyberspace2077.com` |

### 行为

1. 将配置写入 `~/.cyberquant/config.json`
2. 自动补全 `mcp` 子字段的默认值（pageSize=200, timeout=30000）
3. **立即生效**：更新共享状态，后续所有工具调用直接使用新配置，无需重启

### 返回示例

**成功：**
```
配置成功！endpoint: https://api.cyberspace2077.com，现在可以使用 list_routes 查看可用数据路由，或使用 query_data 查询数据。
```

**失败：**
```
配置保存失败：EACCES: permission denied。请检查是否有写入 ~/.cyberquant/ 目录的权限。
```

### 何时使用

- 首次启动 MCP Server 时（无配置文件）
- 需要更换 API Key 时
- 需要切换环境（如从测试环境切换到生产环境）时

---

## 2. list_routes — 列出可用路由（仅目录）

列出当前用户可用的路由**目录级元信息**：`routeSlug`、显示名、说明、分类。**不含**入参/返回字段——避免上百个路由的全量参数一次性占满上下文。

### 参数

无参数。自动使用配置中的 API Key 获取对应用户权限下的路由列表。

### 调用接口

`GET /api/v1/api-list`（结果在 MCP Server 内存缓存 2 分钟，list→detail 连贯调用零重复网络）

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
