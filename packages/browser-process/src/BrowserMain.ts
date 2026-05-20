#!/usr/bin/env ts-node
/**
 * 浏览器主进程入口（Browser Main）
 *
 * 对应 Chrome 中的 chrome/browser/ + BrowserMainRunner
 *
 * 这是整个浏览器的启动入口。在 Chrome 中，浏览器主进程：
 *   1. 初始化所有子系统（网络、存储、GPU 等）
 *   2. 管理标签页（Tab）
 *   3. 为每个标签页创建渲染进程
 *   4. 协调进程间通信（IPC）
 *
 * 在这个学习浏览器中，我们提供两种运行模式：
 *   1. 单进程模式（默认）：所有渲染在同一个进程中完成
 *   2. 多进程模式：使用 child_process.fork() 创建独立的渲染进程
 *
 * 用法：
 *   npx ts-node packages/browser-process/src/BrowserMain.ts --url examples/basic-html/index.html
 */

import * as fs from 'fs';
import * as path from 'path';
import { RenderPipeline } from '@browser/renderer-process';
import { LayoutViewer } from '@browser/output';
import { HttpClient } from '@browser/network';

interface BrowserOptions {
  url?: string;
  html?: string;
  css?: string;
  viewportWidth: number;
  viewportHeight: number;
}

/**
 * 解析命令行参数
 */
function parseArgs(): BrowserOptions {
  const args = process.argv.slice(2);
  const options: BrowserOptions = {
    viewportWidth: 800,
    viewportHeight: 600,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--url':
        options.url = args[++i];
        break;
      case '--html':
        options.html = args[++i];
        break;
      case '--css':
        options.css = args[++i];
        break;
      case '--width':
        options.viewportWidth = parseInt(args[++i], 10);
        break;
      case '--height':
        options.viewportHeight = parseInt(args[++i], 10);
        break;
    }
  }

  return options;
}

/**
 * 主函数 —— 浏览器的入口
 */
async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   Learning Browser v1.0                  ║');
  console.log('║   A minimal browser for learning         ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const options = parseArgs();
  let html: string;
  let cssList: string[] = [];

  // 1. 获取 HTML 内容
  if (options.url) {
    if (options.url.startsWith('http://') || options.url.startsWith('https://')) {
      // 远程 URL：通过网络获取
      console.log(`Fetching: ${options.url}`);
      const client = new HttpClient();
      try {
        const response = await client.fetch(options.url);
        html = response.body;
        console.log(`  Status: ${response.status} (${response.contentType})`);
      } catch (err: any) {
        console.error(`  Error fetching: ${err.message}`);
        process.exit(1);
      }
    } else {
      // 本地文件
      const filePath = path.resolve(options.url);
      console.log(`Loading: ${filePath}`);
      html = fs.readFileSync(filePath, 'utf-8');

      // 尝试加载同目录下的 style.css
      const cssPath = path.join(path.dirname(filePath), 'style.css');
      if (fs.existsSync(cssPath)) {
        cssList.push(fs.readFileSync(cssPath, 'utf-8'));
        console.log(`  CSS: ${cssPath}`);
      }
    }
  } else if (options.html) {
    html = options.html;
    console.log('Loading from --html argument');
  } else {
    console.error('Usage: --url <url-or-file> or --html <html-string>');
    process.exit(1);
  }

  if (options.css) {
    cssList.push(options.css);
  }

  console.log(`\nViewport: ${options.viewportWidth}×${options.viewportHeight}`);

  // 2. 运行渲染流水线
  console.log('\n--- Rendering ---\n');
  const pipeline = new RenderPipeline(options.viewportWidth, options.viewportHeight);
  const { layoutRoot } = pipeline.render(html, cssList);

  // 3. 输出布局结果
  const viewer = new LayoutViewer();
  const layoutText = viewer.render(layoutRoot);
  console.log(layoutText);

  console.log('--- Done ---');
}

main().catch(console.error);
