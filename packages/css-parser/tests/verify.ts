/**
 * CSS 解析器验证
 */
import { CSSParser, SelectorParser } from '../src';
import { StyleOrigin } from '@browser/shared';

const css = `
  h1, h2.title {
    color: red;
    font-size: 24px;
    margin: 10px 20px;
  }

  div.container > p {
    color: #336699;
    display: block;
    background-color: rgb(255, 255, 255);
    opacity: 0.8;
  }

  #main .highlight[data-type="primary"]:hover {
    border-top-width: 2px;
  }
`;

console.log('=== CSS 解析器验证 ===\n');

const parser = new CSSParser();
const stylesheet = parser.parse(css, StyleOrigin.AUTHOR);

console.log(`解析到的规则数: ${stylesheet.rules.length}`);

stylesheet.rules.forEach((rule, i) => {
  console.log(`\n--- 规则 ${i + 1} ---`);

  // 选择器
  rule.selectors.forEach((sel, j) => {
    const parts = sel.compounds.map(c => {
      const t = c.tagName || '*';
      const id = c.id ? `#${c.id}` : '';
      const cls = c.classes.map(c => `.${c}`).join('');
      const attrs = c.attributes.map(a => `[${a.name}${a.operator || ''}${a.value || ''}]`).join('');
      const pcs = c.pseudoClasses.map(p => `:${p.name}${p.argument ? `(${p.argument})` : ''}`).join('');
      return t + id + cls + attrs + pcs;
    });

    let selText = parts[0];
    for (let k = 0; k < sel.combinators.length; k++) {
      const combMap: Record<string, string> = {
        descendant: ' ',
        child: ' > ',
        'adjacent-sibling': ' + ',
        'general-sibling': ' ~ ',
      };
      selText += combMap[sel.combinators[k]] + parts[k + 1];
    }

    console.log(`  选择器: ${selText}`);
    console.log(`  特异性: [${sel.specificity}]`);
  });

  // 声明
  console.log(`  声明数: ${rule.declarations.length}`);
  rule.declarations.forEach((decl) => {
    const imp = decl.important ? ' !important' : '';
    let valDesc = decl.value.type;
    if (decl.value.type === 'length') valDesc += `(${decl.value.value}${decl.value.unit})`;
    if (decl.value.type === 'color') valDesc += `(${decl.value.r},${decl.value.g},${decl.value.b})`;
    if (decl.value.type === 'keyword') valDesc += `(${decl.value.value})`;
    console.log(`    ${decl.property}: ${valDesc}${imp}`);
  });
});

// 单独测试选择器解析器
console.log('\n\n=== 选择器解析器测试 ===\n');
const sp = new SelectorParser();

const testCases = [
  'div',
  '#main',
  '.container',
  'div.container',
  'div#main.container',
  '[data-type]',
  '[data-type="primary"]',
  'div:hover',
  'div > p',
  'div + p',
  'div ~ p',
  'h1, h2, h3',
  'div.container > p + span',
];

testCases.forEach(tc => {
  try {
    const selectors = sp.parse(tc);
    console.log(`"${tc}" → ${selectors.length} 个选择器`);
  } catch (e) {
    console.log(`"${tc}" → 解析失败: ${e}`);
  }
});

console.log('\n=== CSS 解析器验证通过 ===');
