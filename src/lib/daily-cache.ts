// ============================================================
// 按日 JSON 文件缓存 —— ~/.cyberquant/cache/
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CACHE_DIR = path.join(os.homedir(), '.cyberquant', 'cache');

/** 今日 00:00（本地时间）时间戳 */
function startOfTodayMs(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

/** 清理当日已过期的 JSON 缓存文件（mtime 早于今日 00:00）
 *
 * 目录内仅存放按日 JSON 缓存，故按 .json 后缀 + mtime 判断；
 * 写入用的 .tmp 临时文件后缀不同，不会被误删。清理失败不影响主流程。
 */
function pruneStaleCache(): void {
  try {
    const cutoff = startOfTodayMs();
    for (const name of fs.readdirSync(CACHE_DIR)) {
      if (!name.endsWith('.json')) continue;
      const filePath = path.join(CACHE_DIR, name);
      try {
        if (fs.statSync(filePath).mtimeMs < cutoff) {
          fs.unlinkSync(filePath);
        }
      } catch {
        // 单个文件清理失败（如并发删除），跳过该文件
      }
    }
  } catch {
    // 目录不存在或读失败，忽略
  }
}

/** 读取当日有效 JSON 缓存，文件过期/损坏/结构不符时返回 null */
export function readDailyJsonCache<T>(
  fileName: string,
  validate: (value: unknown) => value is T,
): T | null {
  const filePath = path.join(CACHE_DIR, fileName);

  try {
    const stat = fs.statSync(filePath);
    if (stat.mtimeMs < startOfTodayMs()) return null;

    const raw = fs.readFileSync(filePath, 'utf-8');
    const value: unknown = JSON.parse(raw);
    return validate(value) ? value : null;
  } catch {
    return null;
  }
}

/** 写入 JSON 缓存，并顺手清理当日已过期的旧缓存；缓存失败不影响主流程 */
export function writeDailyJsonCache(fileName: string, value: unknown): void {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });

    const filePath = path.join(CACHE_DIR, fileName);
    const tmpPath = `${filePath}.${process.pid}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(value), 'utf-8');

    // 先清理当日已过期的旧缓存，再落地新缓存，确保最终目录状态干净
    pruneStaleCache();

    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[cyberquant-mcp] 写入缓存失败：${msg}\n`);
  }
}
