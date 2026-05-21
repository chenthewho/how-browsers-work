/**
 * 样式解析器（StyleResolver）
 *
 * 对应 Chrome/Blink 中的 StyleResolver / StyleCascade
 *
 * StyleResolver 是样式系统的核心：
 *   1. 遍历 DOM 树中的每个元素
 *   2. 收集所有匹配该元素的 CSS 规则
 *   3. 按照层叠顺序排序（来源 > !important > 特异性 > 源码顺序）
 *   4. 计算每个属性的最终值（考虑继承和初始值）
 *   5. 解析相对值为绝对值（em → px，百分比等）
 *
 * Chrome 的样式计算流程：
 *   Document::UpdateStyle()
 *     → StyleResolver::StyleForElement()
 *       → StyleCascade::Apply()
 *         → MatchSelector()  // 检查选择器是否匹配
 *         → CascadePriority() // 层叠排序
 *         → ApplyProperty()   // 应用属性值
 */

import { Element } from '@browser/dom';
import { NodeType, StyleOrigin } from '@browser/shared';
import type {
  IDocument,
  IElement,
  INode,
  IComputedStyle,
  StyleSheet,
  StyleRule,
  CSSDeclaration,
  ComplexSelector,
  CSSValue,
} from '@browser/shared';
import { matchesSelector } from './SelectorMatcher';
import { calculateSpecificity, compareSpecificity } from './Specificity';
import {
  createDefaultComputedStyle,
  INHERITED_PROPERTIES,
} from './ComputedStyleDefaults';

/**
 * 样式声明项 —— 记录了来源、特异性，用于层叠排序
 */
interface StyleDeclarationItem {
  property: string;
  value: CSSValue;
  values?: CSSValue[];    // 多值简写的完整值列表
  important: boolean;
  origin: StyleOrigin;
  specificity: [number, number, number];
  sourceOrder: number; // 在样式表中的出现顺序
}

export class StyleResolver {
  // 用户代理样式（内置默认样式）
  private uaStylesheet: StyleSheet | null = null;

  constructor(uaStylesheet?: StyleSheet) {
    this.uaStylesheet = uaStylesheet || null;
  }

  /**
   * 对整棵 DOM 树执行样式解析
   *
   * @param document DOM 文档
   * @param authorStylesheets 作者样式表列表（网页中 <style> 和 <link> 的样式）
   */
  resolve(document: IDocument, authorStylesheets: StyleSheet[]): void {
    // 构建完整的样式表列表（用户代理 + 作者）
    const allStylesheets: StyleSheet[] = [];
    if (this.uaStylesheet) {
      allStylesheets.push(this.uaStylesheet);
    }
    allStylesheets.push(...authorStylesheets);

    // 对每个元素计算样式
    this.resolveElement(document, document.documentElement!, allStylesheets, null);
  }

  /**
   * 递归计算单个元素及其子元素的样式
   *
   * @param document 文档对象
   * @param element 当前元素
   * @param stylesheets 所有样式表
   * @param parentStyle 父元素的计算样式（用于继承）
   */
  private resolveElement(
    document: IDocument,
    element: IElement,
    stylesheets: StyleSheet[],
    parentStyle: IComputedStyle | null
  ): void {
    // 1. 创建默认样式
    const computedStyle = createDefaultComputedStyle();

    // 2. 从父元素继承可继承的属性
    if (parentStyle) {
      this.applyInheritance(computedStyle, parentStyle);
    }

    // 3. 处理内联样式（element.style）
    this.applyInlineStyle(computedStyle, element);

    // 4. 收集所有匹配的样式声明
    const declarations = this.collectMatchingDeclarations(element, stylesheets);

    // 5. 按层叠顺序排序
    declarations.sort((a, b) => this.cascadeCompare(a, b));

    // 6. 依次应用声明（后面的覆盖前面的）
    for (const decl of declarations) {
      this.applyDeclaration(computedStyle, decl);
    }

    // 7. 挂载到元素上
    element.computedStyle = computedStyle;

    // 8. 递归处理子元素
    let child = element.firstChild;
    while (child) {
      if (child.nodeType === NodeType.ELEMENT_NODE) {
        this.resolveElement(document, child as IElement, stylesheets, computedStyle);
      }
      child = child.nextSibling;
    }
  }

  /**
   * 收集所有匹配某个元素的样式声明
   *
   * 这是 Chrome 中 MatchResult 的简化版本。
   * 对于元素，遍历所有样式表中的所有规则，
   * 检查选择器是否匹配，如果匹配则收集其声明。
   */
  private collectMatchingDeclarations(
    element: IElement,
    stylesheets: StyleSheet[]
  ): StyleDeclarationItem[] {
    const result: StyleDeclarationItem[] = [];
    let order = 0;

    for (const sheet of stylesheets) {
      for (const rule of sheet.rules) {
        for (const selector of rule.selectors) {
          // 检查选择器是否匹配当前元素
          if (matchesSelector(selector, element)) {
            // 计算这条规则的特异性
            const specificity = selector.specificity;

            // 收集所有声明
            for (const decl of rule.declarations) {
              result.push({
                property: decl.property,
                value: decl.value,
                values: decl.values,
                important: decl.important,
                origin: sheet.origin,
                specificity,
                sourceOrder: order++,
              });
            }
            // 一个规则可能有多个选择器，但只需要匹配一个
            break;
          }
        }
      }
    }

    return result;
  }

  /**
   * 层叠比较函数 —— 决定哪个声明优先
   *
   * 这是 CSS 层叠的核心算法：
   *   1. 来源 + !important 优先级最高
   *      - 用户代理 !important > 用户 !important > 作者 !important > 作者普通 > 用户普通 > 用户代理普通
   *   2. 相同来源，比较特异性
   *   3. 相同特异性，比较源码顺序（后出现的优先）
   *
   * @returns > 0: a 优先于 b, < 0: b 优先于 a
   */
  private cascadeCompare(a: StyleDeclarationItem, b: StyleDeclarationItem): number {
    // 计算来源+important 的优先级分数（越高越优先）
    const priorityA = this.getCascadePriority(a.origin, a.important);
    const priorityB = this.getCascadePriority(b.origin, b.important);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // 比较特异性
    const specCmp = compareSpecificity(a.specificity, b.specificity);
    if (specCmp !== 0) return specCmp;

    // 比较源码顺序（后出现的优先）
    return a.sourceOrder - b.sourceOrder;
  }

  /**
   * 获取来源 + !important 的优先级分数
   *
   * Chrome 的层叠优先级（从低到高）：
   * 0: 用户代理普通
   * 1: 用户普通
   * 2: 作者普通
   * 3: 动画          （本实现暂不支持）
   * 4: 作者 !important
   * 5: 用户 !important
   * 6: 用户代理 !important
   * 7: 过渡          （本实现暂不支持）
   */
  private getCascadePriority(origin: StyleOrigin, important: boolean): number {
    if (important) {
      switch (origin) {
        case StyleOrigin.AUTHOR: return 4;
        case StyleOrigin.USER: return 5;
        case StyleOrigin.USER_AGENT: return 6;
      }
    } else {
      switch (origin) {
        case StyleOrigin.USER_AGENT: return 0;
        case StyleOrigin.USER: return 1;
        case StyleOrigin.AUTHOR: return 2;
      }
    }
    return 0;
  }

  /**
   * 应用单个样式声明到计算样式
   *
   * 将 CSS 解析出的值转换为计算样式的具体数值。
   * 处理单位转换（em → px）、颜色解析、关键字映射等。
   */
  private applyDeclaration(style: IComputedStyle, decl: StyleDeclarationItem): void {
    const { property, value } = decl;

    switch (property) {
      // 盒模型
      case 'display':
        if (value.type === 'keyword') {
          const validDisplays = ['block', 'inline', 'inline-block', 'flex', 'none', 'table',
                                  'table-row', 'table-cell', 'list-item', 'table-header-group',
                                  'table-row-group', 'table-footer-group'] as const;
          if (validDisplays.includes(value.value as any)) {
            style.display = value.value as any;
          }
        }
        break;

      case 'width':
        style.width = resolveLength(value, style.fontSize, 0);
        break;
      case 'height':
        style.height = resolveLength(value, style.fontSize, 0);
        break;

      // 内边距
      case 'padding':
        if (value.type === 'length') {
          style.paddingTop = style.paddingRight = style.paddingBottom = style.paddingLeft =
            resolveLength(value, style.fontSize, 0);
        }
        break;
      case 'padding-top':
        style.paddingTop = resolveLength(value, style.fontSize, 0);
        break;
      case 'padding-right':
        style.paddingRight = resolveLength(value, style.fontSize, 0);
        break;
      case 'padding-bottom':
        style.paddingBottom = resolveLength(value, style.fontSize, 0);
        break;
      case 'padding-left':
        style.paddingLeft = resolveLength(value, style.fontSize, 0);
        break;

      // 外边距
      case 'margin':
        if (decl.values && decl.values.length > 1) {
          // 多值简写：margin: 30px auto / margin: 10px 20px 30px 40px
          const vals = decl.values.map(v => resolveMarginValue(v, style.fontSize));
          if (vals.length === 2) {
            style.marginTop = style.marginBottom = vals[0];     // 上下
            style.marginRight = style.marginLeft = vals[1];    // 左右
          } else if (vals.length === 3) {
            style.marginTop = vals[0];
            style.marginRight = style.marginLeft = vals[1];
            style.marginBottom = vals[2];
          } else if (vals.length === 4) {
            style.marginTop = vals[0];
            style.marginRight = vals[1];
            style.marginBottom = vals[2];
            style.marginLeft = vals[3];
          }
        } else if (value.type === 'length') {
          const val = resolveLength(value, style.fontSize, 0);
          style.marginTop = style.marginRight = style.marginBottom = style.marginLeft = val;
        } else if (value.type === 'keyword' && value.value === 'auto') {
          style.marginTop = style.marginRight = style.marginBottom = style.marginLeft = 'auto';
        }
        break;
      case 'margin-top':
        style.marginTop = resolveLengthOrAuto(value, style.fontSize);
        break;
      case 'margin-right':
        style.marginRight = resolveLengthOrAuto(value, style.fontSize);
        break;
      case 'margin-bottom':
        style.marginBottom = resolveLengthOrAuto(value, style.fontSize);
        break;
      case 'margin-left':
        style.marginLeft = resolveLengthOrAuto(value, style.fontSize);
        break;

      // 边框宽度
      case 'border-top-width':
        style.borderTopWidth = resolveLength(value, style.fontSize, 0);
        break;
      case 'border-right-width':
        style.borderRightWidth = resolveLength(value, style.fontSize, 0);
        break;
      case 'border-bottom-width':
        style.borderBottomWidth = resolveLength(value, style.fontSize, 0);
        break;
      case 'border-left-width':
        style.borderLeftWidth = resolveLength(value, style.fontSize, 0);
        break;

      // 排版
      case 'font-size':
        if (value.type === 'length') {
          style.fontSize = resolveToPx(value, style.fontSize);
        } else if (value.type === 'percentage') {
          style.fontSize = style.fontSize * (value.value / 100);
        }
        break;
      case 'font-weight':
        if (value.type === 'keyword') {
          if (value.value === 'bold') style.fontWeight = 700;
          else if (value.value === 'normal') style.fontWeight = 400;
        } else if (value.type === 'number') {
          style.fontWeight = value.value;
        }
        break;
      case 'font-style':
        if (value.type === 'keyword' &&
            (value.value === 'normal' || value.value === 'italic')) {
          style.fontStyle = value.value;
        }
        break;
      case 'font-family':
        if (value.type === 'string' || value.type === 'keyword') {
          style.fontFamily = value.value!;
        }
        break;
      case 'line-height':
        if (value.type === 'number') {
          style.lineHeight = value.value;
        } else if (value.type === 'length') {
          style.lineHeight = resolveToPx(value, style.fontSize);
        }
        break;
      case 'text-align':
        if (value.type === 'keyword') {
          const valid = ['left', 'right', 'center', 'justify'] as const;
          if (valid.includes(value.value as any)) style.textAlign = value.value as any;
        }
        break;
      case 'white-space':
        if (value.type === 'keyword' &&
            (value.value === 'normal' || value.value === 'nowrap' || value.value === 'pre')) {
          style.whiteSpace = value.value as any;
        }
        break;

      // 颜色
      case 'color':
        if (value.type === 'color') {
          style.color = { r: value.r, g: value.g, b: value.b, a: value.a };
        }
        break;
      case 'background-color':
        if (value.type === 'color') {
          style.backgroundColor = { r: value.r, g: value.g, b: value.b, a: value.a };
        } else if (value.type === 'keyword' && value.value === 'transparent') {
          style.backgroundColor = null;
        }
        break;

      // 定位
      case 'position':
        if (value.type === 'keyword') {
          const valid = ['static', 'relative', 'absolute', 'fixed'] as const;
          if (valid.includes(value.value as any)) style.position = value.value as any;
        }
        break;

      // 其他
      case 'overflow':
        if (value.type === 'keyword') {
          const valid = ['visible', 'hidden', 'scroll', 'auto'] as const;
          if (valid.includes(value.value as any)) style.overflow = value.value as any;
        }
        break;
      case 'opacity':
        if (value.type === 'number') {
          style.opacity = Math.min(1, Math.max(0, value.value));
        }
        break;
      case 'z-index':
        if (value.type === 'number') {
          style.zIndex = value.value;
        }
        break;
      case 'box-sizing':
        if (value.type === 'keyword' &&
            (value.value === 'content-box' || value.value === 'border-box')) {
          style.boxSizing = value.value;
        }
        break;
      case 'text-decoration':
        // 简化处理，跳过
        break;

      // Flex 属性
      case 'display':
        // 已经处理
        break;
    }
  }

  /**
   * 应用内联样式到计算样式
   * 内联样式（<div style="color: red">）的优先级高于所有外部样式（仅次于 !important）
   */
  private applyInlineStyle(style: IComputedStyle, element: IElement): void {
    const inlineStyle = element.style;
    if (!inlineStyle || !inlineStyle.cssText) return;

    // 遍历内联样式中的属性（简化处理）
    const props: Record<string, string> = {
      color: inlineStyle.getPropertyValue('color'),
      'background-color': inlineStyle.getPropertyValue('background-color'),
      display: inlineStyle.getPropertyValue('display'),
      'font-size': inlineStyle.getPropertyValue('font-size'),
      'font-weight': inlineStyle.getPropertyValue('font-weight'),
      margin: inlineStyle.getPropertyValue('margin'),
      padding: inlineStyle.getPropertyValue('padding'),
      width: inlineStyle.getPropertyValue('width'),
      height: inlineStyle.getPropertyValue('height'),
    };

    for (const [prop, val] of Object.entries(props)) {
      if (!val) continue;

      // 创建临时的声明项（内联样式 = 最高的普通优先级）
      const item: StyleDeclarationItem = {
        property: prop,
        value: parseInlineValue(val),
        important: false,
        origin: StyleOrigin.AUTHOR,
        specificity: [1, 0, 0], // 内联样式的特异性等同于 [1,0,0]
        sourceOrder: 0,
      };

      this.applyDeclaration(style, item);
    }
  }

  /**
   * 从父元素继承可继承的属性
   */
  private applyInheritance(style: IComputedStyle, parentStyle: IComputedStyle): void {
    for (const prop of INHERITED_PROPERTIES) {
      (style as any)[prop] = (parentStyle as any)[prop];
    }
  }
}

// ============================================================
// 值解析辅助函数
// ============================================================

/**
 * 将 CSS 长度值转换为 px 数值
 *
 * 支持的单位：px（直接使用）、em（乘以 fontSize）、rem（乘以根 fontSize）
 */
function resolveToPx(value: CSSValue, fontSize: number): number {
  if (value.type === 'length') {
    switch (value.unit) {
      case 'px': return value.value;
      case 'em': return value.value * fontSize;
      case 'rem': return value.value * 16; // 根字体大小简化为 16px
      case 'pt': return value.value * 4 / 3; // 1pt ≈ 1.333px
      default: return value.value;
    }
  }
  if (value.type === 'number') return value.value;
  return 0;
}

/**
 * 解析长度值或 'auto' 关键字
 */
function resolveLength(value: CSSValue, fontSize: number, fallback: number): number {
  if (value.type === 'keyword' && value.value === 'auto') {
    return fallback;
  }
  return resolveToPx(value, fontSize);
}

/**
 * 解析长度值或 auto
 */
function resolveLengthOrAuto(value: CSSValue, fontSize: number): number | 'auto' {
  if (value.type === 'keyword' && value.value === 'auto') {
    return 'auto';
  }
  return resolveToPx(value, fontSize);
}

/**
 * 解析 margin 简写中的单个值
 */
function resolveMarginValue(value: CSSValue, fontSize: number): number | 'auto' {
  if (value.type === 'keyword' && value.value === 'auto') {
    return 'auto';
  }
  return resolveToPx(value, fontSize);
}

/**
 * 解析内联样式值（简单的值解析）
 */
function parseInlineValue(val: string): CSSValue {
  // 尝试识别颜色
  if (val.startsWith('#')) {
    let h = val.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return {
      type: 'color',
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
      a: 1,
    };
  }

  // 尝试识别带单位的数值
  const numMatch = val.match(/^([\d.]+)(px|em|rem|%|pt)$/);
  if (numMatch) {
    const num = parseFloat(numMatch[1]);
    const unit = numMatch[2];
    if (unit === '%') return { type: 'percentage', value: num };
    return { type: 'length', value: num, unit: unit as any };
  }

  // 尝试识别纯数字
  const pureNum = parseFloat(val);
  if (!isNaN(pureNum)) {
    return { type: 'number', value: pureNum };
  }

  // 默认为关键字
  return { type: 'keyword', value: val };
}
