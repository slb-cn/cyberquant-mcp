# Claude Desktop 配置指南

本文档介绍如何将 CyberQuant MCP Server 集成到 Claude Desktop 中。

## 前置条件

- [Claude Desktop](https://claude.ai/download) 已安装
- Node.js >= 20 已安装
- CyberQuant MCP Server 已构建（`pnpm build`）

## 配置文件位置

编辑 Claude Desktop 的 MCP 配置文件：

- **macOS**：`~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**：`%APPDATA%/Claude/claude_desktop_config.json`

如果文件不存在，直接创建即可。

---

## 方式一：本地构建版（推荐）

适用于从源码构建的场景。

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

> ⚠️ `args` 中的路径必须是**绝对路径**，不支持相对路径或 `~`。

**示例**（macOS）：
```json
{
  "mcpServers": {
    "cyberquant": {
      "command": "node",
      "args": ["/Users/yourname/projects/cyberquant-mcp/dist/index.js"]
    }
  }
}
```

---

## 方式二：npx 运行（发布后可用）

当包发布到 npm 后，可以直接使用 npx 运行，无需克隆源码。

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

---

## 配置字段说明

| 字段 | 说明 |
|------|------|
| `mcpServers` | 所有 MCP Server 的注册表，可配置多个 |
| `cyberquant` | Server 名称，可自定义（如 `cyberquant-data`） |
| `command` | 启动命令，使用 `node` |
| `args` | 命令参数，指向构建后的 `dist/index.js` |

---

## 与其他 MCP Server 共存

如果已经配置了其他 MCP Server，将 `cyberquant` 添加到 `mcpServers` 中即可：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
    },
    "cyberquant": {
      "command": "node",
      "args": ["/absolute/path/to/cyberquant-mcp/dist/index.js"]
    }
  }
}
```

---

## 验证安装

### 1. 重启 Claude Desktop

保存配置文件后，完全退出并重新打开 Claude Desktop。

### 2. 检查工具是否可用

在 Claude Desktop 对话中，点击输入框下方的 🔨（工具）图标，应该能看到以下工具：

- `configure` — 配置 API Key
- `list_routes` — 列出可用数据路由
- `query_data` — 查询数据

### 3. 查看 MCP 日志

如果工具未出现，检查 MCP 日志：

**macOS**：
```bash
# 列出最近的 MCP 日志
ls -lt ~/Library/Logs/Claude/mcp*.log

# 查看最新日志
cat $(ls -t ~/Library/Logs/Claude/mcp*.log | head -1)
```

在日志中搜索 `cyberquant-mcp` 确认 Server 是否启动成功。

### 4. 测试对话

```
你：请帮我查看有哪些可用的数据路由

Claude：（调用 list_routes 工具）
        → 返回可用数据路由列表
```

如果是首次使用（未配置 API Key），AI 会引导你调用 `configure` 工具：

```
你：帮我查一下平安银行最近的股价

Claude：请先配置 API Key 以访问数据服务。我需要你提供 API Key（格式为 sk_live_xxx 或 sk_test_xxx）。

你：我的 API Key 是 sk_live_abc123

Claude：（调用 configure 工具）
        → 配置成功！现在可以使用数据查询功能了。
```

---

## 常见问题

### Q: 配置文件修改后不生效？

完全退出 Claude Desktop（不是最小化），然后重新打开。

### Q: 提示 "module not found"？

确认已运行 `pnpm build`，且 `dist/index.js` 文件存在。

### Q: macOS 上提示 "无法验证开发者"？

```bash
# 移除 Node.js 的隔离属性
xattr -cr $(which node)
```

### Q: Windows 上路径使用反斜杠？

使用正斜杠 `/` 或双反斜杠 `\\`：
```json
{
  "args": ["C:/Users/yourname/projects/cyberquant-mcp/dist/index.js"]
}
```
