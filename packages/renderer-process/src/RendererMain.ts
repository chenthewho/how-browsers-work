/**
 * 渲染进程主入口（Renderer Main）
 *
 * 对应 Chrome 中的 content/renderer/ + RenderThreadImpl
 *
 * 渲染进程是一个独立的 Node.js 进程，由浏览器进程通过 child_process.fork() 创建。
 *
 * 它不直接访问网络或文件系统，而是通过 IPC 与浏览器进程通信：
 *   - 接收 HTML/CSS 内容
 *   - 执行完整的渲染流水线
 *   - 将布局结果发送回浏览器进程
 *
 * 这种架构隔离了渲染工作：如果渲染进程崩溃，浏览器进程不受影响。
 */

import { RenderPipeline } from './Pipeline';
import type { IPCMessage } from '@browser/shared';

/**
 * 启动渲染进程的事件循环
 *
 * 渲染进程等待来自浏览器进程的 IPC 消息，
 * 处理 Navigate 和 LoadHTML 消息，完成渲染后回传布局结果。
 */
export function startRenderer(): void {
  const pipeline = new RenderPipeline(800, 600);
  const tabId = `renderer_${process.pid}`;

  // 通知浏览器进程：渲染器已就绪
  if (process.send) {
    process.send({ type: 'Ready', tabId });
  }

  /**
   * IPC 消息处理 —— 对应 Chrome 中的 mojo 消息分发
   */
  process.on('message', (message: IPCMessage) => {
    switch (message.type) {
      case 'Navigate': {
        // 导航到新 URL：浏览器进程会先获取 HTML，然后发送 LoadHTML
        // 这里只记录导航意图
        console.log(`[Renderer ${tabId}] Navigate to: ${message.url}`);
        break;
      }

      case 'LoadHTML': {
        // 核心流程：接收 HTML 并执行完整渲染流水线
        console.log(`[Renderer ${tabId}] Loading HTML (${message.html.length} bytes)`);

        try {
          // 执行渲染流水线（阶段 2-6）
          const { layoutRoot } = pipeline.render(message.html);

          // 序列化布局树（去除循环引用，转为 JSON 安全格式）
          const serialized = serializeLayoutBox(layoutRoot);

          // 将布局结果发送回浏览器进程
          if (process.send) {
            process.send({
              type: 'LayoutComplete',
              tabId: message.tabId,
              layoutRoot: serialized,
            });
          }
        } catch (err: any) {
          // 渲染错误：发送错误信息回浏览器进程
          console.error(`[Renderer ${tabId}] Render error: ${err.message}`);
          if (process.send) {
            process.send({
              type: 'ScriptError',
              tabId: message.tabId,
              error: `Render error: ${err.message}`,
            });
          }
        }
        break;
      }

      case 'ExecuteScript': {
        // JS 执行（阶段 9 中实现）
        console.log(`[Renderer ${tabId}] Execute script: ${message.script.substring(0, 50)}...`);
        break;
      }

      case 'FetchResponse': {
        // 子资源加载完成（CSS/JS），触发重新渲染
        console.log(`[Renderer ${tabId}] Fetch response: ${message.requestId}`);
        break;
      }
    }
  });
}

/**
 * 序列化布局盒子（去除循环引用，转为纯 JSON）
 */
function serializeLayoutBox(box: any): any {
  return {
    id: box.id,
    tagName: box.element?.tagName?.toLowerCase() || null,
    rect: { ...box.rect },
    margin: { ...box.margin },
    border: { ...box.border },
    padding: { ...box.padding },
    layoutMode: box.layoutMode,
    textContent: box.textContent,
    children: box.children.map((c: any) => serializeLayoutBox(c)),
  };
}

// 如果直接运行此文件，启动渲染器
if (require.main === module) {
  startRenderer();
}
