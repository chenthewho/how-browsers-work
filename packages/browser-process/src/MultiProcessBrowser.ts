/**
 * 多进程浏览器入口
 *
 * 用法：
 *   npx ts-node packages/browser-process/src/MultiProcessBrowser.ts --url examples/basic-html/index.html
 *
 * 与单进程模式的区别：
 *   - 创建一个独立的渲染子进程
 *   - HTML 内容通过 IPC 发送给渲染进程
 *   - 渲染进程完成布局后通过 IPC 返回结果
 *   - 渲染进程崩溃不影响浏览器进程
 */

import * as fs from 'fs';
import * as path from 'path';
import { RenderProcessHost } from './RenderProcessHost';
import { LayoutViewer } from '@browser/output';
import type { SerializedLayoutBox } from '@browser/shared';

function parseArgs(): { url?: string; width: number; height: number } {
  const args = process.argv.slice(2);
  const opts: any = { width: 800, height: 600 };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url') opts.url = args[++i];
    else if (args[i] === '--width') opts.width = parseInt(args[++i]);
    else if (args[i] === '--height') opts.height = parseInt(args[++i]);
  }
  return opts;
}

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   Learning Browser (Multi-Process)       ║');
  console.log('║   Browser Process + Renderer Process     ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const options = parseArgs();
  if (!options.url) {
    console.error('Usage: --url <file-path>');
    process.exit(1);
  }

  // 读取 HTML 和 CSS
  const filePath = path.resolve(options.url);
  console.log(`[Browser] Loading: ${filePath}`);
  const html = fs.readFileSync(filePath, 'utf-8');

  // 创建渲染进程
  const tabId = 'tab-1';
  let layoutReceived = false;

  const renderer = new RenderProcessHost(
    tabId,
    // 布局完成回调
    (tid: string, layout: SerializedLayoutBox) => {
      console.log(`\n[Browser] Layout received from renderer ${tid}\n`);
      displayLayout(layout);
      layoutReceived = true;

      // 显示完成后关闭渲染进程
      renderer.kill();
      process.exit(0);
    },
    // 错误回调
    (tid: string, error: string) => {
      console.error(`[Browser] Error from renderer ${tid}: ${error}`);
      process.exit(1);
    }
  );

  // 启动渲染进程
  renderer.create();

  // 等待渲染进程就绪后发送 HTML
  // （简化处理：直接发送，渲染进程会自动处理）
  setTimeout(() => {
    console.log(`[Browser] Sending HTML to renderer (${html.length} bytes)...`);
    renderer.sendHTML(html, `file://${filePath}`);
  }, 500);

  // 超时处理
  setTimeout(() => {
    if (!layoutReceived) {
      console.error('[Browser] Timeout: no layout received within 10 seconds');
      renderer.kill();
      process.exit(1);
    }
  }, 10000);
}

/**
 * 显示反序列化的布局树
 */
function displayLayout(layout: SerializedLayoutBox): void {
  console.log('--- Layout Tree ---\n');

  function printBox(box: SerializedLayoutBox, indent: string = ''): void {
    const tag = box.tagName || (box.textContent ? `TEXT "${box.textContent.substring(0, 30)}"` : 'ANON');
    const r = box.rect;
    const margin = `m:(${box.margin.top},${box.margin.right},${box.margin.bottom},${box.margin.left})`;

    console.log(`${indent}[${box.layoutMode}] ${tag}`);
    console.log(`${indent}  pos:(${r.x.toFixed(0)},${r.y.toFixed(0)}) size:${r.width.toFixed(0)}×${r.height.toFixed(0)} ${margin}`);

    for (const child of box.children) {
      printBox(child, indent + '  ');
    }
  }

  printBox(layout);
  console.log('\n--- End of Layout ---');
}

main().catch(console.error);
