/**
 * 网络类型定义
 *
 * 对应 Chrome 中的 services/network/
 * 定义了 HTTP 请求和响应的结构
 */

// ============================================================
// HttpRequest —— HTTP 请求
// ============================================================
export interface HttpRequest {
  url: string;
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body?: string;
}

// ============================================================
// HttpResponse —— HTTP 响应
// ============================================================
export interface HttpResponse {
  url: string;            // 最终 URL（重定向后）
  status: number;         // 状态码
  statusText: string;     // 状态文本
  headers: Record<string, string>;
  body: string;           // 响应体
  contentType: string;    // Content-Type（从 headers 中提取）
}

// ============================================================
// Resource —— 加载资源的结果
// 用于缓存和传递给渲染器
// ============================================================
export interface Resource {
  url: string;
  body: string;
  contentType: string;
  // 来源缓存标记（用于后续判断是否过期）
  cachedAt: number;
}

// ============================================================
// FetchOptions —— fetch 选项
// ============================================================
export interface FetchOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  maxRedirects?: number;   // 最大重定向次数，默认 20
  timeout?: number;        // 超时时间（毫秒）
}
