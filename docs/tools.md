# 工具说明（MCP Tools）

MCP Server 提供三个工具（Tool），AI 可以主动调用这些工具来完成任务。

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

## 2. list_routes — 列出可用数据路由

查询当前用户可用的所有数据路由，包含每个路由的查询参数和返回字段说明。

### 参数

无参数。自动使用配置中的 API Key 获取对应用户权限下的路由列表。

### 调用接口

`GET /api/v1/api-list`

### 返回示例

```
可用数据路由（共 5 个）：

【日K线数据】routeSlug: daily-stock
说明：股票日线行情数据，包含开盘价、收盘价、最高价、最低价、成交量等
分类：股票行情
查询参数：
  - tradeDate (date, 可选): 交易日期，格式 YYYY-MM-DD
  - symbol (string, 可选): 股票代码，如 000001.SZ
  - startDate (date, 可选): 开始日期
  - endDate (date, 可选): 结束日期
返回字段：
  - tradeDate (string): 交易日期
  - symbol (string): 股票代码
  - open (number): 开盘价
  - high (number): 最高价
  - low (number): 最低价
  - close (number): 收盘价
  - volume (number): 成交量

使用 query_data 工具查询指定路由的数据，传入 routeSlug 和查询参数。
```

### 何时使用

- 首次使用时了解有哪些可用数据
- 查询数据前确认路由名称（`routeSlug`）和参数格式
- 不确定某个参数名称或类型时

---

## 3. query_data — 查询数据

查询指定路由的数据，结果以 **CSV 格式** 返回（节省 token）。

### 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `routeSlug` | string | ✅ | 路由标识，如 `"daily-stock"`，通过 `list_routes` 获取 |
| `params` | object | — | 查询参数，键值对透传给 API。具体参数参考 `list_routes` 返回的路由说明 |

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
未查询到符合条件的数据。请检查查询参数是否正确，可通过 list_routes 工具查看该路由支持的参数说明。
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

## 典型对话流程

以下是一个完整的 AI 对话流程示例：

```
用户：帮我查一下平安银行最近的股价

AI：（调用 list_routes 查看可用路由）

AI：（调用 query_data）
     routeSlug: "daily-stock"
     params: { symbol: "000001.SZ", startDate: "2024-06-01" }

AI：根据查询结果，平安银行（000001.SZ）最近的交易数据如下：
    | 交易日期 | 开盘 | 最高 | 最低 | 收盘 | 成交量 |
    |---------|------|------|------|------|--------|
    | 06-10   | 12.35| 12.58| 12.30| 12.50| 1567万 |
    | 06-11   | 12.50| 12.65| 12.45| 12.60| 1890万 |
    ...
```

### 流程总结

1. **首次使用** → 调用 `configure` 配置 API Key
2. **了解数据** → 调用 `list_routes` 查看可用路由和参数
3. **查询数据** → 调用 `query_data` 获取 CSV 格式数据
4. **有更多数据** → 根据提示缩小参数范围再次查询
