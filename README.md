# CyberQuant MCP Server

[![Node.js >= 20](https://img.shields.io/badge/Node.js-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![MCP Protocol](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-orange)](https://modelcontextprotocol.io/)

CyberQuant 数据共享平台的 MCP（Model Context Protocol）服务器，让 AI 助手（Claude Desktop、ChatGPT 等）能够直接查询和分析金融数据。

> 工作方式：AI 客户端通过 stdio 与 MCP Server 通信，MCP Server 再向 API Gateway 拉取数据，以 AI 友好的 **CSV 格式**返回。

## 功能特性

### MCP Tools（3 个）

| 工具 | 说明 |
|------|------|
| `configure` | 配置 API Key，首次使用时调用 |
| `list_routes` | 列出当前用户可用的数据路由及参数 Schema |
| `query_data` | 查询指定路由数据，返回 **CSV 格式**（节省 token） |

### MCP Resources（2 个）

| 资源 URI | 说明 |
|----------|------|
| `cyberquant://user/profile` | 当前用户信息（等级、市场权限、速率限制） |
| `cyberquant://routes` | 当前用户可用的数据路由列表 |

### 设计亮点

- **CSV 输出**：相比 JSON 节省 40–60% token，表格结构天然适合 AI 分析
- **自然语言引导**：数据返回附带提示，引导 AI 缩小查询范围而非暴力翻页
- **pageSize 上限保护**：超过 1000 条自动拦截，避免 AI 处理超大数据集
- **运行时配置**：通过 `configure` 工具动态更新 API Key，无需重启

## 快速开始

### 环境要求

- **Node.js** >= 20.0.0

### 1. 接入 MCP 客户端

在 Claude Desktop（或任意 MCP 客户端）的配置文件中添加：

- **macOS**：`~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**：`%APPDATA%/Claude/claude_desktop_config.json`

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

保存后重启客户端即可。> 从源码本地构建运行的方式见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

### 2. 配置 API Key

MCP Server 与 `cyberquant-cli` 共用配置文件 `~/.cyberquant/config.json`：

```json
{
  "endpoint": "https://api.cyberspace2077.com",
  "apiKey": "sk_live_your_api_key_here",
  "mcp": {
    "pageSize": 200,
    "timeout": 30000
  }
}
```

> 💡 也可不手动编辑文件——启动后在对话中直接说"请配置我的 API Key"，AI 会调用 `configure` 工具完成配置。

完整字段说明见 [配置文档](./docs/configuration.md)。

### 3. 开始使用

在对话中直接提问，例如：

```
帮我查一下平安银行最近一周的日K线数据
```

AI 会依次调用 `list_routes` → `query_data`，并以表格形式返回分析结果。更多场景见 [使用示例](./examples/usage-examples.md)。

## 文档

| 文档 | 说明 |
|------|------|
| [配置说明](./docs/configuration.md) | 配置文件格式与字段说明 |
| [工具说明](./docs/tools.md) | 三个 MCP Tool 的详细文档 |
| [Resources 说明](./docs/resources.md) | MCP Resources 介绍 |
| [故障排查](./docs/troubleshooting.md) | 常见问题与解决方案 |
| [使用示例](./examples/usage-examples.md) | 典型对话场景 |

## 贡献

参与开发、构建或发布请参考 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## License

[MIT](./LICENSE)
