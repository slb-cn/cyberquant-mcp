# 故障排查

本文档帮助你诊断和解决使用 CyberQuant MCP Server 时遇到的常见问题。

---

## 首次使用问题

### MCP Server 无法启动

**症状**：Claude Desktop 中没有出现 CyberQuant 工具。

**排查步骤**：

1. 检查 Node.js 版本：
   ```bash
   node --version
   # 需要 >= 20.0.0
   ```

2. 检查是否已完成构建：
   ```bash
   cd cyberquant-mcp
   pnpm build
   # 确认 dist/index.js 存在
   ```

3. 检查 Claude Desktop 配置文件中的路径是否为绝对路径：
   ```json
   {
     "mcpServers": {
       "cyberquant-mcp": {
         "command": "node",
         "args": ["/absolute/path/to/cyberquant-mcp/dist/index.js"]
       }
     }
   }
   ```

4. 查看 Claude Desktop 的 MCP 日志：
   - macOS：`~/Library/Logs/Claude/mcp*.log`
   - 在日志中搜索 `cyberquant` 关键词

---

## 配置问题

### 提示"请先使用 configure 工具配置 API Key"

**原因**：配置文件不存在或缺少 `apiKey` 字段。

**解决方案**：

在 AI 对话中让 AI 调用 `configure` 工具：
```
请帮我配置 API Key：sk_live_xxx
```

或手动创建配置文件：
```bash
mkdir -p ~/.cyberquant
cat > ~/.cyberquant/config.json << 'EOF'
{
  "endpoint": "https://api.cyberspace2077.com",
  "apiKey": "sk_live_your_key_here",
  "mcp": {
    "pageSize": 200,
    "timeout": 30000
  }
}
EOF
```

### 配置保存失败：EACCES permission denied

**原因**：没有写入 `~/.cyberquant/` 目录的权限。

**解决方案**：
```bash
# 检查目录权限
ls -la ~/.cyberquant/

# 修复权限
chmod 755 ~/.cyberquant/
chmod 644 ~/.cyberquant/config.json
```

---

## API 调用错误

### API Key invalid or expired（401）

**原因**：API Key 无效或已过期。

**解决方案**：
1. 检查 API Key 格式是否正确（`sk_live_xxx` 或 `sk_test_xxx`）
2. 确认 API Key 是否仍然有效
3. 使用 `configure` 工具重新配置正确的 API Key

### Insufficient permissions（403）

**原因**：用户等级不足以访问该数据路由。

**解决方案**：
1. 读取 `cyberquant://user/profile` 资源查看当前等级
2. 查看路由的 `requiredTier` 字段了解所需等级
3. 联系管理员升级账户等级

### API route not found（404）

**原因**：`routeSlug` 不存在或拼写错误。

**解决方案**：
1. 调用 `list_routes` 查看所有可用路由
2. 确认使用正确的 `routeSlug` 值

### Rate limit exceeded（429）

**原因**：请求频率超过限制。

**解决方案**：
1. MCP Server 会自动重试（最多 3 次，指数退避）
2. 如果重试仍然失败，等待一段时间后重试
3. 读取 `cyberquant://user/profile` 查看速率限制信息

### 请求超时

**原因**：查询数据量过大或网络延迟高。

**解决方案**：
1. 缩小查询参数范围（如缩小日期区间、指定具体代码）
2. 增大 `mcp.timeout` 配置值（默认 30000ms）
3. 减小 `mcp.pageSize` 配置值

### Service temporarily unavailable（503）

**原因**：API Gateway 暂时不可用。

**解决方案**：
1. MCP Server 会自动重试（最多 3 次）
2. 等待几分钟后重试
3. 如果持续出现，联系平台管理员

---

## 数据查询问题

### pageSize 超限警告

**症状**：查询被拦截，返回 pageSize 超过 1000 的警告。

**解决方案**：
1. 编辑 `~/.cyberquant/config.json`，将 `mcp.pageSize` 设为 1000 以内
2. 推荐使用默认值 200
3. 大数据量任务建议使用 `cyberquant-cli` 配合编程脚本处理

### hasMore 提示反复出现

**症状**：每次查询都提示"还有更多数据未返回"。

**解决方案**：
1. 这是设计行为——MCP Server 不自动翻页
2. 缩小查询参数范围：
   - 缩小日期区间（如只查最近一周）
   - 指定具体股票代码（如只查 `000001.SZ`）
   - 添加更多过滤条件
3. 目标是让单次查询返回 50-200 条精确数据，更适合 AI 分析

### 未查询到符合条件的数据

**可能原因**：
1. 查询参数有误（如日期格式不对）
2. 该数据确实不存在
3. 用户权限不包含该市场

**解决方案**：
1. 调用 `list_routes` 确认路由参数说明
2. 检查参数格式是否正确
3. 读取 `cyberquant://user/profile` 确认市场权限

---

## 日志查看

MCP Server 的所有日志输出到 **stderr**（不影响 stdout 的 MCP 通信）。

### 查看 Claude Desktop 中的 MCP 日志

**macOS**：
```bash
# 列出 MCP 日志文件
ls ~/Library/Logs/Claude/mcp*.log

# 查看 CyberQuant 相关日志
grep "cyberquant-mcp" ~/Library/Logs/Claude/mcp*.log
```

### 日志内容示例

```
[cyberquant-mcp] MCP Server 启动中...
[cyberquant-mcp] 已加载配置：endpoint=https://api.cyberspace2077.com, pageSize=200, timeout=30000
[cyberquant-mcp] MCP Server 已连接 (stdio)
```

未配置时：
```
[cyberquant-mcp] MCP Server 启动中...
[cyberquant-mcp] 未找到配置文件，请使用 configure 工具配置 API Key
[cyberquant-mcp] MCP Server 已连接 (stdio)
```

---

## 开发模式调试

使用 `pnpm dev` 启动开发模式，日志会直接输出到终端 stderr：

```bash
cd cyberquant-mcp
pnpm dev
# 日志输出在此终端中可见
```
