/**
 * DOMTokenList —— classList 的实现
 *
 * 对应 Chrome/Blink 中的 blink::DOMTokenList
 * 提供对元素 class 属性的操作：add、remove、toggle、contains
 *
 * 实现方式：维护一个字符串集合，通过回调同步到元素的 class 属性
 */
import type { IDOMTokenList, IElement } from '@browser/shared';
export declare class DOMTokenList implements IDOMTokenList {
    private _tokens;
    private _element;
    constructor(element: IElement, className: string);
    get length(): number;
    item(index: number): string | null;
    contains(token: string): boolean;
    add(...tokens: string[]): void;
    remove(...tokens: string[]): void;
    toggle(token: string): boolean;
    toString(): string;
    /**
     * 将内部状态同步回元素的 class 属性
     */
    private _syncToElement;
}
//# sourceMappingURL=DOMTokenList.d.ts.map