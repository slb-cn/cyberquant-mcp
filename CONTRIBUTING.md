# 贡献指南

本文档面向 cyberquant-mcp 的**维护者与贡献者**，涵盖架构、开发环境、项目结构与发布流程。终端用户使用文档请参考 [README](./README.md)。

## 架构

```
┌─────────────────┐     stdio      ┌──────────────────┐     HTTPS     ┌──────────────┐
│  AI 客户端       │ ◄────────────► │  MCP Server      │ ◄───────────► │  API Gateway  │
│  Claude Desktop  │                │  (本项目)         │               │              │
└─────────────────┘                └──────────────────┘               └──────────────┘
```

MCP Server 作为 API Gateway 的智能客户端，通过 stdio 协议与 AI 客户端通信，将金融数据以 AI 友好的 CSV 格式返回。

## 开发环境

```bash
pnpm install          # 安装依赖
pnpm dev              # 开发模式（tsx 直接运行 TypeScript）
pnpm build            # 构建（tsup → dist/）
```

## 项目结构

```
cyberquant-mcp/
├── src/
│   ├── index.ts              # stdio 入口
│   ├── server.ts             # MCP 服务器（注册 Tools + Resources）
│   ├── tools/
│   │   ├── configure.ts      # configure — 配置 API Key
│   │   ├── list.ts           # list_routes — 路由目录（仅元信息）
│   │   ├── detail.ts         # get_route_detail — 单路由入参/返回字段详情
│   │   ├── query.ts          # query_data — CSV 数据查询
│   │   └── clear-routes-cache.ts # clear_routes_cache — 清除路由元数据缓存
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

## 发布

### 版本管理

版本号维护在 `package.json` 的 `version` 字段（当前 `0.1.7`）。

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
