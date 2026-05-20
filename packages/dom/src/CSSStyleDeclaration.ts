/**
 * CSSStyleDeclaration —— element.style 的实现
 *
 * 对应 Chrome/Blink 中的 blink::CSSStyleDeclaration
 * 管理内联样式，通过 camelCase 属性访问
 *
 * 例如：element.style.color = 'red'
 *       element.style.backgroundColor = 'blue'
 */

import type { ICSSStyleDeclaration, IElement } from '@browser/shared';

export class CSSStyleDeclarationBase {
  // 内部用 Map 存储 CSS 属性值
  private _properties: Map<string, string> = new Map();
  private _element: IElement;

  constructor(element: IElement) {
    this._element = element;
  }

  /**
   * cssText: 获取或设置完整的样式字符串
   * 例如："color: red; font-size: 16px"
   */
  get cssText(): string {
    const result: string[] = [];
    this._properties.forEach((value, key) => {
      result.push(`${key}: ${value}`);
    });
    return result.join('; ');
  }

  set cssText(value: string) {
    this._properties.clear();
    // 解析分号分隔的属性
    for (const part of value.split(';')) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) continue;
      const prop = trimmed.substring(0, colonIdx).trim();
      const val = trimmed.substring(colonIdx + 1).trim();
      this._properties.set(prop, val);
    }
  }

  getPropertyValue(property: string): string {
    return this._properties.get(property) || '';
  }

  setProperty(property: string, value: string): void {
    this._properties.set(property, value);
  }

  removeProperty(property: string): string {
    const oldValue = this._properties.get(property) || '';
    this._properties.delete(property);
    return oldValue;
  }
}

/**
 * 创建带 Proxy 的 CSSStyleDeclaration，支持动态属性
 * 例如：style.color = 'red' 和 style['background-color'] = 'blue'
 */
export function createCSSStyleDeclaration(element: IElement): ICSSStyleDeclaration {
  const decl = new CSSStyleDeclarationBase(element);

  return new Proxy(decl, {
    get(target, prop: string) {
      // 如果属性在实例上存在，直接返回
      if (prop in target) {
        return (target as any)[prop];
      }
      // 否则当作 CSS 属性名处理（camelCase → kebab-case 转换）
      const cssProp = camelToKebab(prop);
      return target.getPropertyValue(cssProp);
    },
    set(target, prop: string, value: any) {
      if (prop in target) {
        (target as any)[prop] = value;
      } else {
        const cssProp = camelToKebab(prop);
        target.setProperty(cssProp, value);
      }
      return true;
    },
  }) as unknown as ICSSStyleDeclaration;
}

/**
 * camelCase → kebab-case 转换
 * 例如：backgroundColor → background-color
 */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
