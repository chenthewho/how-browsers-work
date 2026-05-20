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
export interface NavigateMessage {
    type: 'Navigate';
    tabId: string;
    url: string;
}
export interface LoadHTMLMessage {
    type: 'LoadHTML';
    tabId: string;
    html: string;
    baseUrl: string;
}
export interface FetchResponseMessage {
    type: 'FetchResponse';
    requestId: string;
    body: string;
    status: number;
    contentType: string;
}
export interface ExecuteScriptMessage {
    type: 'ExecuteScript';
    tabId: string;
    script: string;
}
export interface FetchRequestMessage {
    type: 'FetchRequest';
    requestId: string;
    url: string;
    tabId: string;
}
export interface LayoutCompleteMessage {
    type: 'LayoutComplete';
    tabId: string;
    layoutRoot: SerializedLayoutBox;
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
    error: string;
}
export interface ReadyMessage {
    type: 'Ready';
    tabId: string;
}
export type IPCMessage = NavigateMessage | LoadHTMLMessage | FetchResponseMessage | ExecuteScriptMessage | FetchRequestMessage | LayoutCompleteMessage | ConsoleLogMessage | ScriptErrorMessage | ReadyMessage;
//# sourceMappingURL=ipc.d.ts.map