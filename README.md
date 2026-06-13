# CyberQuant MCP Server

[![Node.js >= 20](https://img.shields.io/badge/Node.js-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![MCP Protocol](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-orange)](https://modelcontextprotocol.io/)

CyberQuant 数据共享平台的 MCP (Model Context Protocol) 服务器，让 AI 助手（Claude Desktop、ChatGPT 等）能够直接查询和分析金融数据。

## 架构

```
┌─────────────────┐     stdio      ┌──────────────────┐     HTTPS     ┌──────────────┐
│  AI 客户端       │ ◄────────────► │  MCP Server      │ ◄───────────► │  API Gateway  │
│  Claude Desktop  │                │  (本项目)         │               │              │
└─────────────────┘                └──────────────────┘               └──────────────┘
```

MCP Server 作为 API Gateway 的智能客户端，通过 stdio 协议与 AI 客户端通信，将金融数据以 AI 友好的 CSV 格式返回。

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

- **CSV 输出**：相比 JSON 节省 40-60% token，表格结构天然适合 AI 分析
- **自然语言引导**：数据返回附带智能提示，引导 AI 缩小查询范围
- **pageSize 上限保护**：超过 1000 条自动拦截，避免 AI 处理超大数据集
- **不自动翻页**：`hasMore` 时引导 AI 缩小参数范围，不暴露 cursor
- **运行时配置**：通过 `configure` 工具动态更新 API Key，无需重启

## 快速开始

### 环境要求

- **Node.js** >= 20.0.0
- **pnpm**（推荐）或 npm

### 安装

```bash
# 克隆项目
git clone <repo-url>
cd cyberquant-mcp

# 安装依赖
pnpm install

# 构建
pnpm build
```

### 配置

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

> 💡 你也可以不手动编辑配置文件，启动后在 AI 对话中直接调用 `configure` 工具完成配置。

**配置字段说明：**

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|:----:|--------|------|
| `endpoint` | string | ✅ | — | API Gateway 地址 |
| `apiKey` | string | ✅ | — | API Key（`sk_live_xxx` 或 `sk_test_xxx`） |
| `mcp.pageSize` | number | — | 200 | 单次查询返回条数，上限 1000 |
| `mcp.timeout` | number | — | 30000 | 请求超时时间（ms） |

### 与 Claude Desktop 集成

编辑 Claude Desktop 配置文件：

- **macOS**：`~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**：`%APPDATA%/Claude/claude_desktop_config.json`

添加以下配置：

```json
{
  "mcpServers": {
    "cyberquant": {
      "command": "node",
      "args": ["/absolute/path/to/cyberquant-mcp/dist/index.js"]
    }
  }
}
```

保存后重启 Claude Desktop，即可在对话中使用 CyberQuant 数据查询功能。

> 📖 更多配置方式（npx、环境变量等）详见 [examples/claude-desktop-config.md](./examples/claude-desktop-config.md)

## 开发

```bash
# 开发模式（tsx 直接运行 TypeScript）
pnpm dev

# 构建（tsup → dist/）
pnpm build
```

## 项目结构

```
cyberquant-mcp/
├── src/
│   ├── index.ts              # stdio 入口
│   ├── server.ts             # MCP 服务器（注册 Tools + Resources）
│   ├── tools/
│   │   ├── configure.ts      # configure — 配置 API Key
│   │   ├── list.ts           # list_routes — 列出可用路由
│   │   └── query.ts          # query_data — CSV 数据查询
│   ├── resources/
│   │   ├── user-profile.ts   # cyberquant://user/profile
│   │   └── route-list.ts     # cyberquant://routes
│   ├── lib/
│   │   ├── api-client.ts     # API Gateway HTTP 客户端（含重试+超时）
│   │   ├── config.ts         # 配置管理
│   │   ├── errors.ts         # 错误类型
│   │   └── state.ts          # 共享状态
│   └── types/
│       └── index.ts          # 类型定义
├── dist/                     # 构建产物（tsup 输出，已 gitignore）
├── docs/                     # 使用文档
├── examples/                 # 配置示例
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

## 技术栈

| 技术 | 用途 |
|------|------|
| TypeScript (ESM) | 主语言，target ES2022 |
| Node.js >= 20 | 运行时（原生 fetch） |
| [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) | MCP 协议实现 |
| [zod](https://zod.dev) | Tool 参数校验 |
| [tsup](https://tsup.egoist.dev) | 构建打包 |
| pnpm | 包管理 |

## 文档

- [配置说明](./docs/configuration.md) — 详细的配置文件格式与字段说明
- [工具说明](./docs/tools.md) — 三个 MCP Tool 的详细使用文档
- [Resources 说明](./docs/resources.md) — MCP Resources 介绍
- [故障排查](./docs/troubleshooting.md) — 常见问题与解决方案
- [Claude Desktop 配置示例](./examples/claude-desktop-config.md) — 客户端集成指南
- [使用示例](./examples/usage-examples.md) — 典型对话场景

## 发布

### 版本管理

版本号维护在 `package.json` 的 `version` 字段（当前 `0.1.0`）。

版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)（SemVer）：`主版本.次版本.修订号`，变更记录维护在 [CHANGELOG.md](./CHANGELOG.md)。

**发布前检查清单**：

```bash
# 1. 更新版本号（手动修改 package.json 的 version 字段）
# 2. 更新 CHANGELOG.md
# 3. 确保构建通过
pnpm build

# 4. 提交版本更新并打标签
git add package.json CHANGELOG.md
git commit -m "chore: bump version to 0.1.0"
git tag v0.1.0
git push origin main --tags
```

### 前置准备

1. **注册 npm 账号**：https://www.npmjs.com/signup
2. **确认包名可用**：包名 `cyberquant-mcp` 为非 scope 包（与 `cyberquant-cli` 同款命名），发布前在 [npmjs.com/package/cyberquant-mcp](https://www.npmjs.com/package/cyberquant-mcp) 确认未被占用。
3. **登录 npm**：

```bash
npm login
# 输入用户名、密码、邮箱（开启 2FA 时还需 OTP）
```

### 构建与发布

```bash
# 构建项目（package.json 的 prepublishOnly 钩子也会在 publish 前自动触发 build）
pnpm build

# 检查构建产物
ls -la dist/

# 发布到 npm（指定官方源以兼容镜像环境）
npm publish --registry https://registry.npmjs.org/

# 或发布 beta 版本
npm publish --tag beta
```

### 验证发布

```bash
# 查看包信息（确认版本号、入口、bin 已正确上传）
npm view cyberquant-mcp

# 或在浏览器查看：https://www.npmjs.com/package/cyberquant-mcp
```

> ⚠️ 本项目是 MCP Server，直接 `npx cyberquant-mcp` 会启动 stdio 服务并阻塞等待客户端连接，**不会自动退出**。验证安装后建议直接通过 MCP 客户端集成使用：

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

### 发布后续

- npm 镜像同步通常需要几分钟到数小时
- 包信息地址：https://www.npmjs.com/package/cyberquant-mcp

### 回滚发布

npm 不支持删除已发布版本，只能弃用或发布修复版本：

```bash
# 弃用某个版本，提示用户升级
npm deprecate cyberquant-mcp@0.1.0 "Critical bug, use 0.1.1 instead"

# 发布新版本修复问题后即可
```

## License

[MIT](./LICENSE)
