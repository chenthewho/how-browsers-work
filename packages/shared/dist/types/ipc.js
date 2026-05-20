"use strict";
/**
 * IPC（进程间通信）类型定义
 *
 * 对应 Chrome 中的 mojo / IPC 消息系统
 * 浏览器进程和渲染进程之间通过消息进行通信
 *
 * Chrome 的安全模型：
 * 渲染进程不能直接访问网络、文件系统等
 * 它们必须通过 IPC 向浏览器进程请求这些资源
 */
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=ipc.js.map