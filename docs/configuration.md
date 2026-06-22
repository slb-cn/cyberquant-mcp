# 配置说明

CyberQuant MCP Server 使用配置文件管理 API 连接信息和查询参数。

## 配置文件路径

```
~/.cyberquant/config.json
```

此配置文件与 [cyberquant-cli](https://github.com/cyberquant/cyberquant-cli) 共用。MCP Server 从 `mcp` 子字段读取专有配置，CLI 的 `pageSize`、`maxTerminalRecords` 等字段被 MCP 忽略，互不影响。

## 字段说明

### 基础字段

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|:----:|--------|------|
| `endpoint` | string | ✅ | — | API Gateway 地址，如 `https://api.cyberspace2077.com` |
| `apiKey` | string | ✅ | — | API Key，格式为 `sk_live_xxx` 或 `sk_test_xxx` |

### MCP 专有字段（`mcp` 对象）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|:----:|--------|------|
| `mcp.pageSize` | number | — | `200` | 单次查询返回的数据条数，上限 `1000` |
| `mcp.timeout` | number | — | `30000` | HTTP 请求超时时间（毫秒） |

> 💡 `mcp` 字段缺失时，MCP Server 会自动补全默认值并写回配置文件，不影响 CLI 使用。

## 完整配置示例

```json
{
  "endpoint": "https://api.cyberspace2077.com",
  "apiKey": "sk_live_abc123def456",
  "mcp": {
    "pageSize": 200,
    "timeout": 30000
  }
}
```

## 配置方式

### 方式一：通过 AI 对话配置（推荐）

在 AI 客户端对话中直接调用 `configure` 工具：

```
用户：请配置我的 API Key
AI：（调用 configure 工具）
     apiKey: sk_live_abc123def456
     endpoint: https://api.cyberspace2077.com
     pageSize: 200
```

调用后 MCP Server 会自动创建/更新配置文件，无需手动编辑。`apiKey`、`endpoint` 与 `pageSize` 均可省略：**传入则覆盖，省略则保留配置文件中的现有值**（仅当现有值也缺失时才用默认值）。其中 `apiKey` 仅首次配置必填——后续反复调用调整 `endpoint`/`pageSize` 时可省略，将保留现有 Key，不会重置此前设好的 `pageSize`。

> 💡 若不确定是否已配置，可**不传任何参数**调用 `configure` 查询当前配置状态（只读，返回是否已配置、`endpoint`、`pageSize`，不回显密钥、不写文件），再决定是否需要提供 `apiKey`。

### 方式二：手动编辑配置文件

1. 创建目录（如果不存在）：
   ```bash
   mkdir -p ~/.cyberquant
   ```

2. 创建或编辑 `~/.cyberquant/config.json`：
   ```bash
   vim ~/.cyberquant/config.json
   ```

3. 写入配置内容（参考上方示例）

4. 确保 AI 客户端可以读取此文件

## pageSize 上限机制

当 `mcp.pageSize > 1000` 时，MCP Server **不会发起 API 请求**，而是直接返回警告提示：

> ⚠️ 当前配置的单次查询数量为 N 条，超过上限 1000 条。大模型不擅长直接在庞大的数值矩阵中做复杂的数学运算（如精确计算长期均线、RSI、布林带等），建议：
> 1. 将 mcp.pageSize 调整为 1000 以内（推荐 200）
> 2. 使用编程脚本（Python/Node.js）配合 cyberquant-cli 处理大数据量任务
> 3. 缩小查询参数范围，获取更精准的数据子集

**推荐值**：`200`（默认），适合大多数 AI 分析场景。

## timeout 行为

- 默认 `30000ms`（30 秒）
- 通过 Node.js 原生 `AbortSignal.timeout()` 实现请求级超时
- 超时后返回错误提示：`请求超时（30000ms），请缩小查询范围或稍后重试`
- API Gateway 的 data 路由 socket 超时为 20 秒，30 秒默认值留有重试余地

## 与 CLI 共用配置的兼容性

`~/.cyberquant/config.json` 是两个工具共享的：

```
~/.cyberquant/config.json
├── endpoint      ← MCP + CLI 共用
├── apiKey        ← MCP + CLI 共用
├── pageSize      ← CLI 使用，MCP 忽略
├── maxTerminalRecords  ← CLI 使用，MCP 忽略
└── mcp           ← MCP 专有，CLI 忽略
    ├── pageSize
    └── timeout
```

两个工具可以安全地共用同一个配置文件，不会互相干扰。

## 首次运行行为

1. 如果配置文件不存在 → MCP Server 启动但处于**未配置状态**
2. AI 调用任何数据工具（`list_routes`、`query_data`）时返回配置提示
3. AI 调用 `configure` 工具 → 自动创建配置文件并生效
4. 如果配置文件缺少 `mcp` 字段 → 自动补全默认值并写回
