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
export declare class CSSStyleDeclarationBase {
    private _properties;
    private _element;
    constructor(element: IElement);
    /**
     * cssText: 获取或设置完整的样式字符串
     * 例如："color: red; font-size: 16px"
     */
    get cssText(): string;
    set cssText(value: string);
    getPropertyValue(property: string): string;
    setProperty(property: string, value: string): void;
    removeProperty(property: string): string;
}
/**
 * 创建带 Proxy 的 CSSStyleDeclaration，支持动态属性
 * 例如：style.color = 'red' 和 style['background-color'] = 'blue'
 */
export declare function createCSSStyleDeclaration(element: IElement): ICSSStyleDeclaration;
//# sourceMappingURL=CSSStyleDeclaration.d.ts.map