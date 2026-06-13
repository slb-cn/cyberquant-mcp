# CLAUDE.md

## 项目定位

cyberquant-mcp 是数据共享平台的 MCP Server，作为 API Gateway 的客户端，通过 stdio 向 AI 模型暴露数据访问能力。

**架构**：`AI 客户端 → MCP Server (本项目) → API Gateway`

## 技术栈

TypeScript (ESM) + Node.js >= 20 + `@modelcontextprotocol/sdk` + zod + tsup + pnpm

## 常用命令

```bash
pnpm install          # 安装依赖
pnpm build            # tsup 构建 → dist/
pnpm dev              # tsx 开发运行
```

## 关键约束

1. **日志只能写 stderr** — stdout 用于 MCP stdio 通信，绝对不能污染
2. **所有 API 请求必须带** `X-Client-Type: mcp` header
3. **pageSize 上限 1000** — 超过时不发请求，直接返回警告提示
4. **CSV 格式返回数据** — 表头取首条数据字段名，节省 token
5. **不自动翻页** — hasMore 时用自然语言引导 AI 缩小查询范围，不暴露 cursor
6. **自然语言引导** — 所有返回（数据、错误、警告）均附带清晰提示
7. **无第三方 HTTP 库** — 使用 Node 20+ 原生 fetch
8. **重试**：仅 429/503，最多 3 次，尊重 Retry-After，指数退避上限 10s
9. **与 cyberquant-cli 共用配置** — `~/.cyberquant/config.json`，MCP 从 `mcp` 字段读取专有配置

## 仓库结构

```
src/
├── index.ts              # stdio 入口
├── server.ts             # MCP 服务器（注册 Tools + Resources）
├── tools/query.ts        # query_data — CSV 数据查询
├── tools/list.ts         # list_routes — 路由列表
├── resources/            # user-profile / routes
├── lib/api-client.ts     # API Gateway HTTP 客户端（含重试+超时）
├── lib/config.ts         # 配置管理
├── lib/errors.ts         # 错误类型
└── types/index.ts        # 类型定义
```
