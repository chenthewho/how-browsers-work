/**
 * 脚本执行器（Script Runner）
 *
 * 对应 Chrome 中的 V8 集成层（third_party/blink/renderer/bindings/）
 *
 * 使用 Node.js 的 vm 模块创建隔离的 JavaScript 执行环境。
 * 这个环境只暴露浏览器 DOM API，不暴露 Node.js API（require, process, fs 等）。
 * 这样就模拟了浏览器中渲染进程的 JS 沙箱。
 *
 * Chrome 使用 V8 Isolate 来实现 JS 隔离，每个渲染进程有自己的 Isolate。
 * 我们的 vm.createContext 提供了类似的隔离效果。
 */

import * as vm from 'vm';
import type { IDocument } from '@browser/shared';
import { createDOMBindings } from './DOMBindings';

export class ScriptRunner {
  private context: vm.Context;

  constructor(document: IDocument) {
    // 创建隔离的 V8 上下文（对应 Chrome 的 V8 Isolate + Context）
    this.context = vm.createContext();

    // 注入 DOM API 绑定
    this.setupBindings(document);
  }

  /**
   * 在沙箱中执行 JavaScript 代码
   *
   * @param script JavaScript 源代码
   * @param filename 文件名（用于错误堆栈跟踪）
   * @returns 执行结果
   */
  execute(script: string, filename: string = '<script>'): any {
    try {
      const result = vm.runInContext(script, this.context, {
        filename,
        timeout: 5000,       // 5 秒超时，防止死循环
        breakOnSigint: true,
      });
      return result;
    } catch (err: any) {
      console.error(`[ScriptRunner] Error in ${filename}: ${err.message}`);
      throw err;
    }
  }

  /**
   * 设置 DOM API 绑定
   *
   * 对应 Chrome 中 V8 bindings 的安装过程：
   *   - 创建 window 对象
   *   - 挂载 document 属性
   *   - 挂载 console API
   */
  private setupBindings(document: IDocument): void {
    const bindings = createDOMBindings(document);

    // 先将 DOM 绑定对象注入沙箱上下文
    (this.context as any).docObj = bindings;

    // 注入全局对象到沙箱中（与 Chrome 类似的结构）
    // 使用 _print 避免 console.log 递归调用
    (this.context as any)._print = (level: string, msg: string) => {
      const prefix = level === 'error' ? '\x1b[31m[JS]\x1b[0m' :
                     level === 'warn' ? '\x1b[33m[JS]\x1b[0m' : '[JS]';
      process.stdout.write(`${prefix} ${msg}\n`);
    };

    vm.runInContext(`
      globalThis.console = {
        log: function(...args) {
          const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
          _print('log', msg);
        },
        warn: function(...args) {
          const msg = args.map(a => String(a)).join(' ');
          _print('warn', msg);
        },
        error: function(...args) {
          const msg = args.map(a => String(a)).join(' ');
          _print('error', msg);
        }
      };

      globalThis.document = docObj;
      globalThis.setTimeout = function() {};
      globalThis.setInterval = function() {};
      globalThis.clearTimeout = function() {};
      globalThis.clearInterval = function() {};
    `, this.context);
  }
}
