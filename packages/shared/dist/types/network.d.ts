/**
 * 网络类型定义
 *
 * 对应 Chrome 中的 services/network/
 * 定义了 HTTP 请求和响应的结构
 */
export interface HttpRequest {
    url: string;
    method: 'GET' | 'POST';
    headers: Record<string, string>;
    body?: string;
}
export interface HttpResponse {
    url: string;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    contentType: string;
}
export interface Resource {
    url: string;
    body: string;
    contentType: string;
    cachedAt: number;
}
export interface FetchOptions {
    method?: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: string;
    maxRedirects?: number;
    timeout?: number;
}
//# sourceMappingURL=network.d.ts.map