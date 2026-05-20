/**
 * HTTP 客户端
 *
 * 对应 Chrome 的 services/network/
 *
 * 简化版本：使用 Node.js 内置的 http/https 模块发起请求。
 * 在实际浏览器中，网络请求由浏览器进程发起（渲染进程不能直接访问网络）。
 */

import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import type { HttpResponse, FetchOptions } from '@browser/shared';

export class HttpClient {
  /**
   * 发起 HTTP GET 请求
   */
  async fetch(url: string, options: FetchOptions = {}): Promise<HttpResponse> {
    const { maxRedirects = 20, timeout = 30000 } = options;

    return this._fetch(url, maxRedirects, timeout);
  }

  private _fetch(url: string, maxRedirects: number, timeout: number): Promise<HttpResponse> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const isHttps = parsedUrl.protocol === 'https:';
      const transport = isHttps ? https : http;

      const req = transport.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'GET',
          headers: {
            'User-Agent': 'LearningBrowser/1.0',
            'Accept': 'text/html,application/xhtml+xml,*/*',
          },
          timeout,
        },
        (res) => {
          // 处理重定向
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            if (maxRedirects <= 0) {
              reject(new Error('Too many redirects'));
              return;
            }
            const redirectUrl = new URL(res.headers.location, url).href;
            // 递归跟随重定向
            this._fetch(redirectUrl, maxRedirects - 1, timeout).then(resolve).catch(reject);
            return;
          }

          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf-8');
            const contentType = (res.headers['content-type'] || 'text/html').split(';')[0].trim();
            resolve({
              url,
              status: res.statusCode || 200,
              statusText: res.statusMessage || 'OK',
              headers: res.headers as Record<string, string>,
              body,
              contentType,
            });
          });
        }
      );

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout: ${url}`));
      });

      req.end();
    });
  }
}
