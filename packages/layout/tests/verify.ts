/**
 * 布局引擎集成验证
 * 整合 HTML 解析 → CSS 解析 → 样式计算 → 布局计算
 */
import { HTMLParser } from '@browser/html-parser';
import { CSSParser } from '@browser/css-parser';
import { StyleResolver, USER_AGENT_CSS } from '@browser/style';
import { LayoutEngine } from '../src';
import { StyleOrigin } from '@browser/shared';

const html = `<!DOCTYPE html>
<html>
<head><title>Layout Test</title></head>
<body>
  <div id="container" style="width: 740px; padding: 20px; background-color: #f0f0f0;">
    <h1>Layout Test</h1>
    <p>This is a paragraph with some <strong>bold text</strong> inside.</p>
    <p>Second paragraph with <span style="color: blue;">blue text</span>.</p>
  </div>
</body>
</html>`;

const css = `
  #container { margin: 20px; }
  h1 { color: #333; margin-bottom: 16px; font-size: 28px; }
  p { margin: 10px 0; font-size: 16px; line-height: 24px; }
  strong { font-weight: bold; }
`;

console.log('=== 布局引擎验证 ===\n');

// 1. 完整流水线
const htmlParser = new HTMLParser();
const doc = htmlParser.parse(html);
console.log('1. HTML 解析完成');

const cssParser = new CSSParser();
const uaSheet = cssParser.parse(USER_AGENT_CSS, StyleOrigin.USER_AGENT);
const authorSheet = cssParser.parse(css, StyleOrigin.AUTHOR);
console.log('2. CSS 解析完成');

const resolver = new StyleResolver(uaSheet);
resolver.resolve(doc, [authorSheet]);
console.log('3. 样式计算完成');

// 2. 布局计算
const engine = new LayoutEngine(800, 600);
const layoutRoot = engine.layout(doc.documentElement!);
console.log('4. 布局计算完成\n');

// 3. 打印布局树
function printLayout(box: any, indent: string = '', depth: number = 0) {
  if (depth > 6) return; // 防止太深

  const tag = box.element ? box.element.tagName : (box.textContent ? 'TEXT' : 'ANON');
  const id = box.element?.id ? `#${box.element.id}` : '';
  const text = box.textContent ? ` "${box.textContent.substring(0, 30)}"` : '';
  const r = box.rect;

  console.log(`${indent}[${box.layoutMode}] <${tag}${id}>${text}`);
  console.log(`${indent}  位置: (${Math.round(r.x)}, ${Math.round(r.y)})  尺寸: ${Math.round(r.width)} × ${Math.round(r.height)}`);
  console.log(`${indent}  margin: (${box.margin.top}, ${box.margin.right}, ${box.margin.bottom}, ${box.margin.left})`);

  for (const child of box.children) {
    printLayout(child, indent + '  ', depth + 1);
  }
}

console.log('--- 布局树 ---\n');
printLayout(layoutRoot);
console.log('\n=== 布局引擎验证完成 ===');
