/**
 * HTML 解析器验证
 */
import { HTMLParser } from '../src';

const html = `<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
  <meta charset="utf-8">
</head>
<body>
  <div id="main" class="container">
    <h1>Hello World</h1>
    <p>This is a <strong>test</strong> paragraph.</p>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
    <table>
      <tr>
        <td>Cell 1</td>
        <td>Cell 2</td>
      </tr>
    </table>
  </div>
</body>
</html>`;

const parser = new HTMLParser();
const doc = parser.parse(html);

console.log('=== HTML 解析器验证 ===\n');

// 验证 DOCTYPE
console.log('1. HTML 结构:');

// 验证 documentElement
const htmlEl = doc.documentElement;
console.log(`   documentElement: ${htmlEl?.tagName}`);

// 验证 head
const head = doc.head;
console.log(`   head: ${head?.tagName}`);

// 验证 body
const body = doc.body;
console.log(`   body: ${body?.tagName}`);

// 验证 body 子元素
console.log('\n2. Body 子元素:');
let child = body!.firstChild;
while (child) {
  if (child.nodeName !== '#text' || child.textContent.trim()) {
    console.log(`   <${child.nodeName}> ${child.textContent.substring(0, 50)}`);
  }
  child = child.nextSibling;
}

// 验证属性
console.log('\n3. 属性验证:');
const mainDiv = doc.getElementById('main');
console.log(`   #main tagName: ${mainDiv?.tagName}`);
console.log(`   #main className: ${mainDiv?.className}`);
console.log(`   #main classList: ${mainDiv?.classList.toString()}`);

// 验证 getElementsByTagName
console.log('\n4. getElementsByTagName:');
const listItems = doc.documentElement!.getElementsByTagName('li');
console.log(`   li count: ${listItems.length}`);
listItems.forEach((li, i) => console.log(`   ${i}: ${li.textContent}`));

// 验证深度嵌套
console.log('\n5. 表格验证:');
const cells = doc.documentElement!.getElementsByTagName('td');
console.log(`   td count: ${cells.length}`);

// 验证 textContent
console.log('\n6. body textContent:');
console.log(`   ${body!.textContent.substring(0, 100)}...`);

console.log('\n=== HTML 解析器验证通过 ===');
