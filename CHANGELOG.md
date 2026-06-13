# 更新日志

本项目所有重要变更均记录在此文件中。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added

- 待发布的新增功能。

## [0.1.0] - 2026-06-13

首个可用版本，作为 CyberQuant 数据共享平台的 MCP Server，通过 stdio 向 AI 客户端暴露金融数据查询能力。

### Added

- **MCP Tools（3 个）**
  - `configure`：配置 API Key，支持运行时动态更新，无需重启
  - `list_routes`：列出当前用户可用的数据路由及参数 Schema
  - `query_data`：查询指定路由数据，返回 CSV 格式（节省 token）
- **MCP Resources（2 个）**
  - `cyberquant://user/profile`：当前用户信息（等级、市场权限、速率限制）
  - `cyberquant://routes`：当前用户可用的数据路由列表
- CSV 输出：相比 JSON 节省 40-60% token，表格结构天然适合 AI 分析
- 自然语言引导：数据返回附带智能提示，引导 AI 缩小查询范围
- `pageSize` 上限保护：超过 1000 条自动拦截，避免 AI 处理超大数据集
- 不自动翻页：`hasMore` 时引导 AI 缩小参数范围，不暴露 cursor
- API Gateway HTTP 客户端：原生 fetch，支持 429/503 自动重试（指数退避、尊重 Retry-After）、请求超时
- 所有请求统一携带 `X-Client-Type: mcp` header
- 与 `cyberquant-cli` 共用配置文件 `~/.cyberquant/config.json`，MCP 从 `mcp` 字段读取专有配置

[Unreleased]: https://github.com/slb-cn/cyberquant-mcp/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/slb-cn/cyberquant-mcp/releases/tag/v0.1.0
