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

import type { SerializedLayoutBox } from './layout';

// ============================================================
// IPC 消息联合类型
// 所有 Browser ↔ Renderer 之间的消息
// ============================================================

// --- Browser → Renderer（浏览器进程发给渲染进程）---
export interface NavigateMessage {
  type: 'Navigate';
  tabId: string;
  url: string;
}

export interface LoadHTMLMessage {
  type: 'LoadHTML';
  tabId: string;
  html: string;          // HTML 文本内容
  baseUrl: string;       // 基础 URL（用于解析相对路径）
}

export interface FetchResponseMessage {
  type: 'FetchResponse';
  requestId: string;     // 对应 FetchRequest 的 requestId
  body: string;          // 响应体
  status: number;        // HTTP 状态码
  contentType: string;   // Content-Type 头
}

export interface ExecuteScriptMessage {
  type: 'ExecuteScript';
  tabId: string;
  script: string;        // JavaScript 代码
}

// --- Renderer → Browser（渲染进程发给浏览器进程）---
export interface FetchRequestMessage {
  type: 'FetchRequest';
  requestId: string;     // 请求 ID（用于匹配响应）
  url: string;           // 要请求的 URL
  tabId: string;         // 所属 tab
}

export interface LayoutCompleteMessage {
  type: 'LayoutComplete';
  tabId: string;
  layoutRoot: SerializedLayoutBox;  // 序列化的布局树根节点
}

export interface ConsoleLogMessage {
  type: 'ConsoleLog';
  tabId: string;
  level: 'log' | 'warn' | 'error';
  message: string;
}

export interface ScriptErrorMessage {
  type: 'ScriptError';
  tabId: string;
  error: string;         // 错误描述
}

export interface ReadyMessage {
  type: 'Ready';
  tabId: string;
}

// ============================================================
// 完整的 IPC 消息联合类型
// ============================================================
export type IPCMessage =
  | NavigateMessage
  | LoadHTMLMessage
  | FetchResponseMessage
  | ExecuteScriptMessage
  | FetchRequestMessage
  | LayoutCompleteMessage
  | ConsoleLogMessage
  | ScriptErrorMessage
  | ReadyMessage;
