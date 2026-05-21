/**
 * JavaScript 集成验证
 * 测试在沙箱中执行 JS 并操作 DOM
 */
import { HTMLParser } from '@browser/html-parser';
import { CSSParser } from '@browser/css-parser';
import { StyleResolver, USER_AGENT_CSS } from '@browser/style';
import { LayoutEngine } from '@browser/layout';
import { LayoutViewer } from '@browser/output';
import { ScriptRunner } from '../src';
import { StyleOrigin } from '@browser/shared';

const html = `<!DOCTYPE html>
<html>
<body>
  <div id="main">
    <h1>Hello World</h1>
    <p id="para">Original text</p>
  </div>
</body>
</html>`;

const css = `#main { padding: 20px; } h1 { color: red; }`;

// 1. 解析 HTML + CSS + 样式计算
const doc = new HTMLParser().parse(html);
const cssParser = new CSSParser();
const ua = cssParser.parse(USER_AGENT_CSS, StyleOrigin.USER_AGENT);
const author = cssParser.parse(css, StyleOrigin.AUTHOR);
new StyleResolver(ua).resolve(doc, [author]);

console.log('=== JavaScript 集成验证 ===\n');

// 2. 创建 ScriptRunner（注入 document 绑定）
const runner = new ScriptRunner(doc);

// 3. 执行 JS 代码
const script = `
  // 测试 1: getElementById
  var main = document.getElementById('main');
  console.log('Main element found:', main.tagName);

  // 测试 2: querySelector
  var h1 = main.querySelector('h1');
  console.log('H1 text:', h1.textContent);

  // 测试 3: 修改元素内容
  var para = document.getElementById('para');
  para.textContent = 'Modified by JavaScript!';
  console.log('Para modified:', para.textContent);

  // 测试 4: 修改样式
  para.style.color = 'blue';
  para.style.fontSize = '20px';
  console.log('Para color:', para.style.color);

  // 测试 5: 创建新元素
  var newDiv = document.createElement('div');
  newDiv.id = 'dynamic';
  newDiv.textContent = 'Dynamically created';
  main.appendChild(newDiv);
  console.log('New div added, id:', newDiv.id);
`;

console.log('执行脚本:');
console.log('---');
runner.execute(script);
console.log('---\n');

// 4. 重新计算样式和布局
new StyleResolver(ua).resolve(doc, [author]);
const engine = new LayoutEngine(800, 600);
const layoutRoot = engine.layout(doc.documentElement!);

// 5. 显示修改后的布局
console.log('修改后的布局树:');
const viewer = new LayoutViewer();
console.log(viewer.render(layoutRoot));

console.log('=== 验证完成 ===');
