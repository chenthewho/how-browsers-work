# 第 7 章：多进程架构 — Chrome 的安全模型

## 本章目标

理解为什么 Chrome 是"多进程"浏览器，以及进程间通信（IPC）是如何运作的。

## 7.1 为什么需要多进程？

假设你用单进程浏览器访问了两个网站：

```
Tab 1: example.com（正常网站）
Tab 2: evil.com（恶意网站，尝试占满内存/读取你的文件系统）
```

在单进程中，evil.com 可以让**整个浏览器**崩溃。多进程架构下：

```
Browser Process（主进程：UI、网络、文件）
  ├── Renderer Process 1（Tab 1 的沙箱）
  ├── Renderer Process 2（Tab 2 的沙箱→崩溃，不影响其他）
  └── GPU Process（图形加速）
```

每个渲染进程运行在受限的沙箱中，不能直接访问网络、文件系统。

## 7.2 我们的实现

### 浏览器进程：RenderProcessHost

`packages/browser-process/src/RenderProcessHost.ts`

```typescript
export class RenderProcessHost {
  create(): void {
    // 用 child_process.fork() 创建独立进程
    this.process = fork(rendererEntry, [], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],  // 'ipc' 通道
    });

    // 监听渲染进程消息
    this.process.on('message', (msg: IPCMessage) => {
      this.handleMessage(msg);
    });

    // 崩溃检测
    this.process.on('exit', (code) => {
      if (code !== 0) {
        // 渲染进程崩溃！但浏览器进程不受影响
        this.onError(this.tabId, 'Renderer crashed');
      }
    });
  }

  // 发送 HTML 给渲染进程
  sendHTML(html: string, baseUrl: string): void {
    this.process.send({ type: 'LoadHTML', tabId, html, baseUrl });
  }
}
```

### 渲染进程：RendererMain

`packages/renderer-process/src/RendererMain.ts`

```typescript
export function startRenderer(): void {
  const pipeline = new RenderPipeline(800, 600);

  process.on('message', (message: IPCMessage) => {
    switch (message.type) {
      case 'LoadHTML': {
        // 执行完整渲染流水线
        const { layoutRoot } = pipeline.render(message.html);

        // 发送结果回浏览器进程
        process.send({
          type: 'LayoutComplete',
          tabId: message.tabId,
          layoutRoot: serializeLayoutBox(layoutRoot),
        });
        break;
      }
    }
  });

  // 通知浏览器：就绪
  process.send({ type: 'Ready', tabId });
}
```

## 7.3 IPC 消息协议

`packages/shared/src/types/ipc.ts` 定义了所有消息类型：

```
浏览器 → 渲染器：
  - Navigate { url }        导航到新页面
  - LoadHTML { html }       发送 HTML 内容
  - FetchResponse { body }  子资源加载完成
  - ExecuteScript { script }执行 JS

渲染器 → 浏览器：
  - Ready {}                渲染器就绪
  - LayoutComplete { tree } 布局完成
  - FetchRequest { url }    请求子资源（CSS/JS/图片）
  - ConsoleLog { msg }      console.log 输出
  - ScriptError { error }   脚本错误
```

## 7.4 消息流：一次完整的导航

```
  时序图：一次完整的多进程导航

  Browser Process                          Renderer Process
  ═══════════════                          ════════════════
       │                                         │
       │  fork(RendererMain)                     │
       │────────────────────────────────────────→│ 进程创建
       │                                         │
       │                      ◄── Ready ────────│ 渲染器就绪
       │                                         │
       │  HttpClient.fetch(URL)                  │
       │  ↓                                      │
       │  HTML: "<!DOCTYPE html>..."             │
       │                                         │
       │  ──── LoadHTML(html) ────────────────→ │
       │                                         │ HTMLParser.parse()
       │                                         │ CSSParser.parse()
       │                                         │ StyleResolver.resolve()
       │                                         │ LayoutEngine.layout()
       │                                         │
       │                      ◄── LayoutComplete │ 布局结果
       │                           {layoutRoot}  │
       │                                         │
       │  LayoutViewer.render()                  │
       │  ↓                                      │
       │  文本布局输出到终端                        │
       │                                         │
       │  kill()                                 │
       │────────────────────────────────────────→│ 进程终止
       │                                         ✕

  关键点：
  • 渲染进程永远不直接访问文件系统或网络
  • 如果渲染器在第 6 步崩溃，浏览器进程在第 7 步收到 exit 事件
  • 浏览器进程可以创建新的渲染进程重试，用户无感知
```


## 7.5 崩溃隔离测试

尝试在渲染进程中故意崩溃：

```typescript
// 在 RendererMain 的处理逻辑中插入
process.on('message', (msg) => {
  if (msg.type === 'LoadHTML') {
    if (msg.html.includes('CRASH')) {
      throw new Error('Simulated crash!');
    }
  }
});
```

浏览器进程会收到 `exit` 事件并报告：

```
[Browser] Renderer process 12345 exited (code: 1, signal: null)
[Browser] Error from renderer: Renderer crashed with code 1
```

但浏览器进程本身继续运行——这就是多进程架构的价值。

## 7.6 为什么不用 Worker Threads？

Node.js 有两种并行方式：

| 特性 | `child_process.fork()` | `worker_threads` |
|---|---|---|
| 内存隔离 | ✅ 独立 V8 堆 | ❌ 共享堆 |
| 崩溃隔离 | ✅ 进程死亡不影响父进程 | ❌ 异常可能影响 |
| Chrome 相似度 | ✅ 完全匹配进程模型 | ❌ 更像进程内线程 |
| 性能开销 | 较高 | 较低 |

选择 `fork()` 因为它更贴合 Chrome 的架构——学习目标是理解浏览器，不是追求性能。

## 7.7 Chrome 的真实架构

我们的简化版 vs Chrome 的真实版：

| 组件 | 我们的实现 | Chrome 实现 |
|---|---|---|
| IPC 机制 | `process.send()` | Mojo（更高效的 IPC 框架） |
| 进程发现 | 手动管理 | Service Manager |
| 沙箱 | Node.js 进程隔离 | OS 级 sandbox（seccomp-bpf/macOS sandbox） |
| 站点隔离 | 无 | Site Isolation（不同 origin 不同进程） |
| 进程数量 | 每 Tab 一个 | 每 origin 一个 + GPU + Network + ... |

## 练习题

1. 启动两个渲染进程，分别渲染不同的 HTML 页面，验证它们独立工作
2. 在渲染进程中模拟无限循环，验证浏览器进程不会卡死
3. 画出 Chrome 打开 3 个 Tab 时的进程拓扑图

> 下一章：[JavaScript 集成](./08-js-integration.md) — 让脚本操作 DOM
