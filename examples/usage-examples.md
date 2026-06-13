# 使用示例

以下是与 CyberQuant MCP Server 交互的典型场景示例。首次使用请先完成下方「快速上手」的安装与配置。

## 快速上手：安装与配置（首次使用 MCP）

本服务是一个 MCP（Model Context Protocol）Server，需接入 MCP 客户端（如 Claude Desktop）后，由 AI 调用其工具来查询数据。下面以 Claude Desktop 为例，说明从安装到首次查询的完整流程。

### 1. 前置条件

- 已安装 **Node.js ≥ 20.0.0**（终端执行 `node -v` 检查；客户端会通过 `npx` 自动拉起本服务，无需手动安装）
- 已拥有 CyberQuant 平台的 **API Key**（格式为 `sk_live_xxx` 或 `sk_test_xxx`）

### 2. 在 Claude Desktop 中接入

编辑 Claude Desktop 配置文件：

- macOS：`~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows：`%APPDATA%\Claude\claude_desktop_config.json`

添加 `cyberquant` 服务：

```json
{
  "mcpServers": {
    "cyberquant": {
      "command": "npx",
      "args": ["-y", "cyberquant-mcp"]
    }
  }
}
```

保存后**重启 Claude Desktop**，即可在对话中使用本服务提供的工具。

### 3. 配置 API Key

任选其一：

**方式 A：在对话中配置（推荐，见下方「场景一」）**
连接后直接告诉 Claude 你的 API Key，它会调用 `configure` 工具自动写入配置。

**方式 B：手动编辑配置文件**
创建并编辑 `~/.cyberquant/config.json`（与 cyberquant-cli 共用）：

```json
{
  "endpoint": "https://api.cyberspace2077.com",
  "apiKey": "sk_live_你的APIKey",
  "mcp": {
    "pageSize": 200,
    "timeout": 30000
  }
}
```

字段说明：
- `endpoint`：API Gateway 地址，默认 `https://api.cyberspace2077.com`，可自定义
- `mcp.pageSize`：单次查询返回条数，默认 200，**上限 1000**（超过将返回警告且不发起请求）
- `mcp.timeout`：单次请求超时（毫秒），默认 30000（30 秒）

### 4. 验证

在 Claude Desktop 中询问「你们平台有哪些数据路由」，若返回路由列表即接入成功，完整流程见下方「场景一」。

---

## 场景一：首次使用（配置 API Key + 查看路由）

```
用户：你好，我想查看你们平台有什么数据

Claude：我来帮你查看可用的数据路由。
       （调用 list_routes → 返回"请先使用 configure 工具配置 API Key"）

Claude：看起来还没有配置 API Key。请提供你的 API Key（格式为 sk_live_xxx 或 sk_test_xxx），
       我来帮你完成配置。

用户：我的 API Key 是 sk_live_abc123def456

Claude：（调用 configure，参数：apiKey="sk_live_abc123def456"）
       → 配置成功！endpoint: https://api.cyberspace2077.com

Claude：（调用 list_routes）
       → 返回可用数据路由列表

Claude：你的账户可以访问以下数据路由：
       1. 日K线数据（daily-stock）— 股票日线行情
       2. 分钟K线数据（minute-stock）— 股票分钟行情
       3. 指数行情（index-daily）— 指数日线数据
       4. 财务数据（financial-report）— 上市公司财务报表
       5. 行业分类（industry-class）— 行业分类信息

       你想查询哪类数据？
```

---

## 场景二：查询股票日线数据

```
用户：帮我查一下平安银行最近一周的日K线数据

Claude：（调用 query_data）
       routeSlug: "daily-stock"
       params: { symbol: "000001.SZ", startDate: "2024-06-03", endDate: "2024-06-07" }

       → 返回 CSV 数据：
       tradeDate,symbol,open,high,low,close,volume
       2024-06-03,000001.SZ,12.35,12.58,12.30,12.50,15678900
       2024-06-04,000001.SZ,12.50,12.65,12.45,12.60,18902300
       2024-06-05,000001.SZ,12.58,12.72,12.55,12.68,20124500
       2024-06-06,000001.SZ,12.68,12.75,12.60,12.70,17568900
       2024-06-07,000001.SZ,12.70,12.88,12.65,12.82,22345600

       本次查询返回 5 条数据。

Claude：平安银行（000001.SZ）最近一周的日K线数据如下：

       | 日期 | 开盘 | 最高 | 最低 | 收盘 | 成交量 |
       |------|------|------|------|------|--------|
       | 06-03 | 12.35 | 12.58 | 12.30 | 12.50 | 1568万 |
       | 06-04 | 12.50 | 12.65 | 12.45 | 12.60 | 1890万 |
       | 06-05 | 12.58 | 12.72 | 12.55 | 12.68 | 2012万 |
       | 06-06 | 12.68 | 12.75 | 12.60 | 12.70 | 1757万 |
       | 06-07 | 12.70 | 12.88 | 12.65 | 12.82 | 2235万 |

       本周呈现上涨趋势，从 12.50 涨至 12.82，涨幅约 2.56%，成交量逐步放大。
```

---

## 场景三：数据量过大时缩小查询范围

当查询范围较大时，MCP Server 不会自动翻页，而是通过 `hasMore` 提示引导缩小范围。

```
用户：查一下沪深300成分股 2024 年的日K线数据

Claude：（调用 query_data）
       routeSlug: "daily-stock"
       params: { symbol: "000300.SH", startDate: "2024-01-01", endDate: "2024-12-31" }

       → 返回 200 条 CSV 数据 + hasMore 提示

Claude：查询返回了 200 条数据，但该时间范围内还有更多数据未返回。
       由于沪深300全年的数据量较大，建议缩小查询范围：

       1. 只查最近一个月的数据
       2. 按季度分别查询
       3. 只查关键时间节点

       你想怎么缩小范围？

用户：那就只查 2024 年第一季度的吧

Claude：（调用 query_data）
       routeSlug: "daily-stock"
       params: { symbol: "000300.SH", startDate: "2024-01-01", endDate: "2024-03-31" }

       → 返回约 60 条数据

Claude：沪深300指数（000300.SH）2024年第一季度共 59 个交易日数据，
       季度开盘 3431.75，收盘 3545.32，涨幅约 3.31%...
```

---

## 提示

- 首次使用时，AI 会自动引导你完成 `configure` 配置
- 查询数据前，AI 通常会先调用 `list_routes` 了解可用路由
- 当数据量过大时，AI 会建议缩小查询范围（推荐单次 50–200 条）
- 常见错误处理见 [故障排查](../docs/troubleshooting.md)
