import { HTMLParser } from '@browser/html-parser';
import { CSSParser } from '@browser/css-parser';
import { StyleResolver, USER_AGENT_CSS } from '../src';
import { StyleOrigin } from '@browser/shared';

const html = '<!DOCTYPE html><html><body><p>Hello <strong>bold</strong></p></body></html>';
const css = 'p { color: #333; } strong { font-weight: bold; color: green; }';

const doc = new HTMLParser().parse(html);
const cssp = new CSSParser();
const ua = cssp.parse(USER_AGENT_CSS, StyleOrigin.USER_AGENT);
const author = cssp.parse(css, StyleOrigin.AUTHOR);

console.log('Author rules:', author.rules.length);
author.rules.forEach((r: any, i: number) => {
  console.log('  Rule', i, 'selectors:', r.selectors.map((s: any) =>
    s.compounds.map((c: any) => `tag:${c.tagName} id:${c.id} cls:${c.classes}`).join(' | ')
  ));
  r.declarations.forEach((d: any) =>
    console.log('    ', d.property, '=', JSON.stringify(d.value))
  );
});

const resolver = new StyleResolver(ua);
resolver.resolve(doc, [author]);

const strong = doc.body!.querySelector('strong');
if (strong && strong.computedStyle) {
  console.log('\nstrong computedStyle:');
  console.log('  color:', JSON.stringify(strong.computedStyle.color));
  console.log('  fontWeight:', strong.computedStyle.fontWeight);
  console.log('  display:', strong.computedStyle.display);
}

const p = doc.body!.querySelector('p');
if (p && p.computedStyle) {
  console.log('\np computedStyle:');
  console.log('  color:', JSON.stringify(p.computedStyle.color));
}
