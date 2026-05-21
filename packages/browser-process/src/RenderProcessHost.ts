/**
 * 渲染进程宿主（RenderProcessHost）
 *
 * 对应 Chrome 中的 content/browser/renderer_host/render_process_host_impl.h
 *
 * 浏览器进程通过 RenderProcessHost 管理渲染子进程的生命周期：
 *   1. 创建渲染子进程（child_process.fork）
 *   2. 通过 IPC 发送消息（导航、HTML 内容）
 *   3. 接收渲染结果（布局树）
 *   4. 监控渲染进程健康，处理崩溃
 *
 * Chrome 中每个 Tab 可以有多个 RenderProcessHost（site isolation），
 * 这里简化为每 Tab 一个渲染进程。
 */

import { fork, type ChildProcess } from 'child_process';
import * as path from 'path';
import type { IPCMessage, SerializedLayoutBox } from '@browser/shared';

export type LayoutCallback = (tabId: string, layout: SerializedLayoutBox) => void;
export type ErrorCallback = (tabId: string, error: string) => void;

export class RenderProcessHost {
  private process: ChildProcess | null = null;
  private tabId: string;
  private onLayout: LayoutCallback;
  private onError: ErrorCallback;

  constructor(tabId: string, onLayout: LayoutCallback, onError: ErrorCallback) {
    this.tabId = tabId;
    this.onLayout = onLayout;
    this.onError = onError;
  }

  /**
   * 创建渲染子进程
   *
   * 对应 Chrome 中 RenderProcessHostImpl::Init()
   *
   * 使用 child_process.fork() 创建独立的 Node.js 进程。
   * fork() 的好处：
   *   - 独立的 V8 堆（内存隔离）
   *   - 进程崩溃不会影响浏览器进程
   *   - 内置 IPC（通过 process.send / process.on('message')）
   */
  create(): void {
    const rendererEntry = path.join(__dirname, '..', '..', 'renderer-process', 'src', 'RendererMain.ts');

    // 使用 ts-node 执行 TypeScript 入口
    this.process = fork(rendererEntry, [], {
      execArgv: ['--require', 'ts-node/register'],
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],  // 'ipc' 通道用于消息传递
    });

    console.log(`[Browser] Renderer process created (PID: ${this.process.pid})`);

    // 监听来自渲染进程的消息
    this.process.on('message', (message: IPCMessage) => {
      this.handleMessage(message);
    });

    // 监听渲染进程退出（崩溃检测）
    this.process.on('exit', (code, signal) => {
      console.log(`[Browser] Renderer process ${this.process!.pid} exited (code: ${code}, signal: ${signal})`);
      this.process = null;

      if (code !== 0 && code !== null) {
        this.onError(this.tabId, `Renderer crashed with code ${code}`);
      }
    });

    // 转发渲染进程的 stdout/stderr
    if (this.process.stdout) {
      this.process.stdout.on('data', (data: Buffer) => {
        process.stdout.write(`[Renderer ${this.tabId}] ${data}`);
      });
    }
    if (this.process.stderr) {
      this.process.stderr.on('data', (data: Buffer) => {
        process.stderr.write(`[Renderer ${this.tabId}] ${data}`);
      });
    }
  }

  /**
   * 发送 HTML 内容到渲染进程
   *
   * 对应 Chrome 中 RenderProcessHost::Send(new NavigationRequest(...))
   */
  sendHTML(html: string, baseUrl: string): void {
    if (!this.process) {
      this.onError(this.tabId, 'Renderer process not available');
      return;
    }
    this.process.send({
      type: 'LoadHTML',
      tabId: this.tabId,
      html,
      baseUrl,
    });
  }

  /**
   * 请求渲染进程执行 JavaScript
   */
  sendScript(script: string): void {
    if (!this.process) return;
    this.process.send({
      type: 'ExecuteScript',
      tabId: this.tabId,
      script,
    });
  }

  /**
   * 终止渲染进程
   */
  kill(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  /**
   * 检查渲染进程是否存活
   */
  isAlive(): boolean {
    return this.process !== null && !this.process.killed;
  }

  // ============================================================
  // IPC 消息处理
  // ============================================================
  private handleMessage(message: IPCMessage): void {
    switch (message.type) {
      case 'Ready':
        console.log(`[Browser] Renderer ${message.tabId} is ready`);
        break;

      case 'LayoutComplete':
        // 接收渲染结果
        this.onLayout(message.tabId, message.layoutRoot);
        break;

      case 'ConsoleLog':
        console.log(`[Console ${message.tabId}] [${message.level}] ${message.message}`);
        break;

      case 'ScriptError':
        this.onError(message.tabId, message.error);
        break;

      case 'FetchRequest':
        // 渲染进程请求获取子资源（后续由浏览器进程的网络模块处理）
        console.log(`[Browser] Fetch request from renderer: ${message.url}`);
        break;
    }
  }
}
