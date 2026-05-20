/**
 * 选择器匹配器（Selector Matcher）
 *
 * 对应 Chrome/Blink 中的 SelectorChecker
 *
 * 判断一个复杂选择器是否匹配某个 DOM 元素。
 * 这是样式计算的核心步骤 —— 对于每个元素，需要遍历所有样式规则，
 * 检查每条规则的选择器是否匹配该元素。
 *
 * Chrome 的 SelectorChecker 使用高效的算法（Bloom filter + 从右向左匹配），
 * 这里实现简化的版本以展示核心原理。
 */

import type { IElement, INode, ComplexSelector, CompoundSelector, Combinator } from '@browser/shared';
import { NodeType } from '@browser/shared';

/**
 * 判断一个复杂选择器是否匹配某个元素
 *
 * 匹配算法（从右向左匹配，与 Chrome 一致）：
 *   1. 先用最右边的复合选择器匹配目标元素
 *   2. 如果有组合器，沿着 DOM 树向上查找满足组合器关系的祖先
 *   3. 继续匹配左边的复合选择器
 *
 * @param selector 复杂选择器（如 div.container > p）
 * @param element 要检查的 DOM 元素
 * @returns 是否匹配
 */
export function matchesSelector(selector: ComplexSelector, element: IElement): boolean {
  const compounds = selector.compounds;
  const combinators = selector.combinators;

  if (compounds.length === 0) return false;

  // 从右向左匹配：
  // 最右边的复合选择器必须匹配目标元素本身
  // 然后依次检查左边的复合选择器和组合器
  let compoundIndex = compounds.length - 1;
  let currentElement: INode | null = element;

  // 第一步：最右边的复合选择器必须匹配目标元素
  if (!matchesCompound(compounds[compoundIndex], currentElement as IElement)) {
    return false;
  }
  compoundIndex--;

  // 第二步：从右向左依次检查组合器和左边的复合选择器
  while (compoundIndex >= 0 && currentElement) {
    const combinator = combinators[compoundIndex]; // 当前复合选择器和下一个复合选择器之间的组合器

    // 向上查找满足组合器关系的节点
    const nextElement = findMatchingAncestor(
      compounds[compoundIndex],
      currentElement,
      combinator
    );

    if (!nextElement) return false;

    currentElement = nextElement;
    compoundIndex--;
  }

  // 所有部分都匹配
  return compoundIndex < 0;
}

/**
 * 判断一个复合选择器是否匹配一个元素
 *
 * 复合选择器由多个简单选择器组成（AND 关系），
 * 所有条件都必须满足。
 */
function matchesCompound(compound: CompoundSelector, element: IElement): boolean {
  // 检查类型选择器
  if (compound.tagName && compound.tagName !== '*') {
    if (element.tagName.toLowerCase() !== compound.tagName.toLowerCase()) {
      return false;
    }
  }

  // 检查 ID 选择器
  if (compound.id) {
    if (element.id !== compound.id) {
      return false;
    }
  }

  // 检查类选择器（所有类都必须存在）
  for (const cls of compound.classes) {
    if (!element.classList.contains(cls)) {
      return false;
    }
  }

  // 检查属性选择器
  for (const attr of compound.attributes) {
    const attrValue = element.getAttribute(attr.name);

    // 存在性检查：[attr]
    if (!attr.operator || attr.value === null || attr.value === '') {
      if (attrValue === null) return false;
      continue;
    }

    // 属性值比较
    if (attrValue === null) return false;

    switch (attr.operator) {
      case '=':
        if (attrValue !== attr.value) return false;
        break;
      case '~=':
        // 空格分隔的单词列表匹配
        if (!attrValue.split(/\s+/).includes(attr.value!)) return false;
        break;
      case '|=':
        // 连字符分隔的前缀匹配
        if (attrValue !== attr.value && !attrValue.startsWith(attr.value! + '-')) return false;
        break;
      case '^=':
        if (!attrValue.startsWith(attr.value!)) return false;
        break;
      case '$=':
        if (!attrValue.endsWith(attr.value!)) return false;
        break;
      case '*=':
        if (!attrValue.includes(attr.value!)) return false;
        break;
    }
  }

  // 检查伪类选择器（简化实现，只支持部分伪类）
  for (const pc of compound.pseudoClasses) {
    if (!matchesPseudoClass(pc.name, element)) {
      return false;
    }
  }

  return true;
}

/**
 * 检查伪类是否匹配元素（简化实现）
 */
function matchesPseudoClass(name: string, element: IElement): boolean {
  switch (name) {
    case 'first-child':
      return element.parentNode?.firstChild === element;

    case 'last-child':
      return element.parentNode?.lastChild === element;

    case 'only-child':
      return element.parentNode?.firstChild === element &&
             element.parentNode?.lastChild === element;

    case 'hover':
    case 'focus':
    case 'active':
    case 'visited':
    case 'link':
      // 动态伪类，简化处理：忽略这些状态
      return true;

    case 'root':
      return element.parentNode?.nodeType === NodeType.DOCUMENT_NODE;

    default:
      // 未知伪类，忽略
      return true;
  }
}

/**
 * 沿着 DOM 树向上查找匹配复合选择器且满足组合器关系的祖先元素
 *
 * @param compound 要匹配的复合选择器
 * @param startElement 起始元素
 * @param combinator 组合器类型
 * @returns 匹配的元素，或 null
 */
function findMatchingAncestor(
  compound: CompoundSelector,
  startElement: INode,
  combinator: Combinator
): INode | null {
  switch (combinator) {
    case 'descendant':
      // 后代选择器：向上找任意祖先
      let ancestor: INode | null = startElement.parentNode;
      while (ancestor) {
        if (ancestor.nodeType === NodeType.ELEMENT_NODE &&
            matchesCompound(compound, ancestor as IElement)) {
          return ancestor;
        }
        ancestor = ancestor.parentNode;
      }
      return null;

    case 'child':
      // 子选择器：必须是直接父元素
      const parent = startElement.parentNode;
      if (parent && parent.nodeType === NodeType.ELEMENT_NODE &&
          matchesCompound(compound, parent as IElement)) {
        return parent;
      }
      return null;

    case 'adjacent-sibling':
      // 邻接兄弟选择器：前一个兄弟元素
      let prev: INode | null = startElement.previousSibling;
      while (prev) {
        if (prev.nodeType === NodeType.ELEMENT_NODE &&
            matchesCompound(compound, prev as IElement)) {
          return prev;
        }
        prev = prev.previousSibling;
      }
      return null;

    case 'general-sibling':
      // 后续兄弟选择器：任意前一个兄弟元素
      let prevSib: INode | null = startElement.previousSibling;
      while (prevSib) {
        if (prevSib.nodeType === NodeType.ELEMENT_NODE &&
            matchesCompound(compound, prevSib as IElement)) {
          return prevSib;
        }
        prevSib = prevSib.previousSibling;
      }
      return null;

    default:
      return null;
  }
}
