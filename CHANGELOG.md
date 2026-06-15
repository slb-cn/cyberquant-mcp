# 更新日志

本项目所有重要变更均记录在此文件中。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.1.2] - 2026-06-15

### Added

- 新增 `get_route_detail` 工具：按 slug 返回单个路由的入参 Schema 与返回字段，按需获取避免一次性塞入全部路由细节
- `api-client` 为路由列表新增 2 分钟进程内缓存，减少重复拉取

### Changed

- `list_routes` 精简为目录级元信息（slug + 简介），细节查询下沉到 `get_route_detail`
- README 与 docs 同步为新的 `list_routes → get_route_detail → query_data` 调用流程

## [0.1.1] - 2026-06-14

### Added

- `query_data` 参数说明补充传值格式（单值 / 多值 / 范围 / 日期），减少 AI 试错
- README 新增「快速上手」安装与配置章节

### Changed

- README 精简为对外说明，开发者文档拆分至 `CONTRIBUTING.md`

## [0.1.0] - 2026-06-13

首个可用版本，通过 stdio 向 AI 客户端暴露 CyberQuant 数据共享平台的查询能力。

### Added

- **MCP Tools**：`configure`（运行时配置 API Key）、`list_routes`、`query_data`
- **MCP Resources**：`cyberquant://user/profile`、`cyberquant://routes`
- CSV 格式返回数据，相比 JSON 节省 40–60% token
- `pageSize` 上限 1000 保护，超过自动拦截
- 不自动翻页：`hasMore` 时通过自然语言引导 AI 缩小查询范围，不暴露 cursor
- API Gateway HTTP 客户端：原生 fetch、429/503 自动重试（指数退避、尊重 Retry-After）、请求超时
- 所有请求统一携带 `X-Client-Type: mcp` header
- 与 `cyberquant-cli` 共用配置 `~/.cyberquant/config.json`，MCP 读取 `mcp` 字段

[0.1.2]: https://github.com/slb-cn/cyberquant-mcp/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/slb-cn/cyberquant-mcp/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/slb-cn/cyberquant-mcp/releases/tag/v0.1.0
