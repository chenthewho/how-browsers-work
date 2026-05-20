/**
 * 样式解析器集成验证
 * 整合 HTML 解析、CSS 解析和样式计算
 */
import { HTMLParser } from '@browser/html-parser';
import { CSSParser, SelectorParser } from '@browser/css-parser';
import { StyleResolver, USER_AGENT_CSS } from '../src';
import { StyleOrigin } from '@browser/shared';

// ============================================================
// 测试 HTML
// ============================================================
const html = `<!DOCTYPE html>
<html>
<head><title>Style Test</title></head>
<body>
  <div id="main" class="container">
    <h1 class="title">Hello World</h1>
    <p>This is a <strong>bold</strong> text.</p>
    <span class="highlight" data-type="primary">highlighted</span>
  </div>
</body>
</html>`;

// ============================================================
// 测试 CSS（作者样式）
// ============================================================
const authorCSS = `
  #main { background-color: #f0f0f0; padding: 20px; }
  h1.title { color: red; font-size: 28px; }
  p { color: #333; margin-bottom: 10px; }
  .highlight[data-type="primary"] { color: blue; font-weight: bold; }
  strong { font-weight: bold; color: green; }
`;

console.log('=== 样式解析器验证 ===\n');

// 1. 解析 HTML
const htmlParser = new HTMLParser();
const doc = htmlParser.parse(html);
console.log('1. HTML 解析完成');

// 2. 解析用户代理样式
const cssParser = new CSSParser();
const uaSheet = cssParser.parse(USER_AGENT_CSS, StyleOrigin.USER_AGENT);
console.log(`2. UA 样式表: ${uaSheet.rules.length} 条规则`);

// 3. 解析作者样式
const authorSheet = cssParser.parse(authorCSS, StyleOrigin.AUTHOR);
console.log(`3. 作者样式表: ${authorSheet.rules.length} 条规则`);

// 4. 样式解析
const resolver = new StyleResolver(uaSheet);
resolver.resolve(doc, [authorSheet]);
console.log('4. 样式计算完成\n');

// 5. 验证结果
function printStyle(element: any, indent: string = '') {
  if (!element.computedStyle) return;

  const cs = element.computedStyle;
  const tag = element.tagName;
  const id = element.id ? `#${element.id}` : '';
  const cls = element.className ? `.${element.className}` : '';

  console.log(`${indent}<${tag}${id}${cls}> — ` +
    `display:${cs.display} ` +
    `fontSize:${cs.fontSize}px ` +
    `color:(${cs.color.r},${cs.color.g},${cs.color.b}) ` +
    `${cs.backgroundColor ? `bg:(${cs.backgroundColor.r},${cs.backgroundColor.g},${cs.backgroundColor.b})` : 'bg:none'} ` +
    `margin:${cs.marginTop} ` +
    `padding:${cs.paddingTop}`);

  let child = element.firstChild;
  while (child) {
    if (child.nodeType === 1) { // ELEMENT_NODE
      printStyle(child, indent + '  ');
    }
    child = child.nextSibling;
  }
}

// 打印 body 及其子元素的样式
if (doc.body) {
  printStyle(doc.body);
}

// 6. 验证级联优先级
console.log('\n--- 层叠优先级验证 ---');

// h1.title 的颜色应该是 red（作者样式覆盖 UA 样式）
const h1 = doc.getElementById('main')?.querySelector('h1');
if (h1 && h1.computedStyle) {
  console.log(`h1.title color: (${h1.computedStyle.color.r},${h1.computedStyle.color.g},${h1.computedStyle.color.b})`);
  console.log(`  期望: red (255,0,0) → ${h1.computedStyle.color.r === 255 && h1.computedStyle.color.g === 0 ? '✓' : '✗'}`);
}

// strong 继承 font-size 从 p
const strong = doc.getElementById('main')?.querySelector('strong');
if (strong && strong.computedStyle) {
  console.log(`strong fontSize: ${strong.computedStyle.fontSize}px`);
  console.log(`  (继承自父元素 p) ✓`);
  console.log(`strong color: (${strong.computedStyle.color.r},${strong.computedStyle.color.g},${strong.computedStyle.color.b})`);
  console.log(`  期望: green (0,128,0) → ${strong.computedStyle.color.g === 128 ? '✓' : '✗'}`);
}

// 属性选择器匹配
const span = doc.getElementById('main')?.querySelector('.highlight');
if (span && span.computedStyle) {
  console.log(`.highlight[data-type="primary"] color: (${span.computedStyle.color.r},${span.computedStyle.color.g},${span.computedStyle.color.b})`);
  console.log(`  期望: blue (0,0,255) → ${span.computedStyle.color.b === 255 ? '✓' : '✗'}`);
  console.log(`.highlight fontWeight: ${span.computedStyle.fontWeight}`);
  console.log(`  期望: bold (700) → ${span.computedStyle.fontWeight === 700 ? '✓' : '✗'}`);
}

console.log('\n=== 样式解析器验证完成 ===');
