/**
 * CSS 特异性（Specificity）计算
 *
 * 对应 Chrome/Blink 中 CSSSelector 的特异性计算
 *
 * CSS 特异性决定了当多个规则匹配同一个元素时，哪个规则优先。
 * 特异性使用三元组 [a, b, c] 表示：
 *   a: ID 选择器的数量（#main）
 *   b: 类选择器(.class)、属性选择器([attr])、伪类(:hover)的数量
 *   c: 类型选择器(div)、伪元素(::before)的数量
 *
 * 比较规则（字典序）：
 *   先比较 a，a 大的胜出
 *   如果 a 相同，比较 b，b 大的胜出
 *   如果 a、b 都相同，比较 c，c 大的胜出
 *   如果全都相同，后面出现的规则覆盖前面的
 *
 * 注意：内联样式（style 属性）有比任何选择器都高的优先级。
 *       内联样式的特异性被视为 [1, 0, 0]（这里单独处理，不通过三元组）
 */

import type { SpecificityTuple, ComplexSelector, CompoundSelector } from '@browser/shared';

/**
 * 计算复杂选择器的特异性
 *
 * @param selector 复杂选择器（如 div.container > p + span）
 * @returns [a, b, c] 特异性元组
 */
export function calculateSpecificity(selector: ComplexSelector): SpecificityTuple {
  let a = 0, b = 0, c = 0;

  for (const compound of selector.compounds) {
    // a: ID 选择器
    if (compound.id) a++;

    // b: 类选择器 + 属性选择器 + 伪类
    b += compound.classes.length;
    b += compound.attributes.length;
    b += compound.pseudoClasses.length;

    // c: 类型选择器
    if (compound.tagName) c++;
  }

  return [a, b, c];
}

/**
 * 比较两个特异性元组
 *
 * @returns
 *   > 0: a 的特异性比 b 高
 *   < 0: a 的特异性比 b 低
 *   = 0: 特异性相同
 */
export function compareSpecificity(a: SpecificityTuple, b: SpecificityTuple): number {
  if (a[0] !== b[0]) return a[0] - b[0];
  if (a[1] !== b[1]) return a[1] - b[1];
  return a[2] - b[2];
}
