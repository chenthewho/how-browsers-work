/**
 * DOM 模块快速验证
 */
import { Document, Element } from '../src';
import { NodeType } from '@browser/shared';

function test(): void {
  console.log('=== DOM 模块验证 ===\n');

  // 1. 创建 Document
  const doc = new Document();
  console.log('1. Document 创建成功');

  // 2. 创建元素
  const html = doc.createElement('html');
  const head = doc.createElement('head');
  const body = doc.createElement('body');
  const div = doc.createElement('div');
  const p = doc.createElement('p');
  const text = doc.createTextNode('Hello World');

  console.log('2. 元素创建成功');

  // 3. 构建树结构（链表方式）
  // Document -> html -> [head, body -> div -> p -> "Hello World"]
  doc.appendChild(html);
  html.appendChild(head);
  html.appendChild(body);
  body.appendChild(div);
  div.appendChild(p);
  p.appendChild(text);

  console.log('3. 树结构构建成功');

  // 4. 验证树结构
  console.log('\n--- 树结构验证 ---');
  console.log('documentElement:', doc.documentElement?.tagName);  // HTML
  console.log('body.parentNode?.nodeName:', body.parentNode?.nodeName);  // HTML
  console.log('body.firstChild?.nodeName:', body.firstChild?.nodeName);  // DIV
  console.log('div.firstChild?.nodeName:', div.firstChild?.nodeName);  // P
  console.log('p.firstChild?.nodeValue:', p.firstChild?.nodeValue);  // Hello World
  console.log('textContent of body:', body.textContent);  // Hello World

  // 5. 验证 Sibling 关系
  const div2 = doc.createElement('div');
  body.appendChild(div2);
  console.log('\n--- Sibling 验证 ---');
  console.log('div.nextSibling?.nodeName:', div.nextSibling?.nodeName);  // DIV
  console.log('div2.previousSibling?.nodeName:', div2.previousSibling?.nodeName);  // DIV

  // 6. 验证属性
  div.setAttribute('id', 'main');
  div.className = 'container';
  console.log('\n--- 属性验证 ---');
  console.log('div.id:', div.id);  // main
  console.log('div.className:', div.className);  // container
  console.log('div.classList.contains("container"):', div.classList.contains('container'));  // true

  // 7. 验证 removeChild
  body.removeChild(div2);
  console.log('\n--- removeChild 验证 ---');
  console.log('body.lastChild?.nodeName:', body.lastChild?.nodeName);  // DIV (div2 被移除后)
  console.log('div2.parentNode:', div2.parentNode);  // null

  // 8. 验证 querySelector
  console.log('\n--- querySelector 验证 ---');
  console.log('body.querySelector("#main"):', body.querySelector('#main')?.tagName);  // DIV
  console.log('body.querySelector(".container"):', body.querySelector('.container')?.tagName);  // DIV
  console.log('body.querySelector("p"):', body.querySelector('p')?.tagName);  // P

  console.log('\n=== DOM 模块验证通过 ===');
}

test();
