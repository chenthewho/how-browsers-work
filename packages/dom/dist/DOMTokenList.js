"use strict";
/**
 * DOMTokenList —— classList 的实现
 *
 * 对应 Chrome/Blink 中的 blink::DOMTokenList
 * 提供对元素 class 属性的操作：add、remove、toggle、contains
 *
 * 实现方式：维护一个字符串集合，通过回调同步到元素的 class 属性
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOMTokenList = void 0;
class DOMTokenList {
    // 内部用 Set 存储类名
    _tokens;
    // 关联的元素（用于回写 class 属性）
    _element;
    constructor(element, className) {
        this._element = element;
        this._tokens = new Set(className
            .split(/\s+/)
            .filter(t => t.length > 0) // 过滤空字符串
        );
    }
    get length() {
        return this._tokens.size;
    }
    item(index) {
        const arr = Array.from(this._tokens);
        return arr[index] || null;
    }
    contains(token) {
        return this._tokens.has(token);
    }
    add(...tokens) {
        for (const token of tokens) {
            this._tokens.add(token);
        }
        this._syncToElement();
    }
    remove(...tokens) {
        for (const token of tokens) {
            this._tokens.delete(token);
        }
        this._syncToElement();
    }
    toggle(token) {
        if (this._tokens.has(token)) {
            this._tokens.delete(token);
            this._syncToElement();
            return false;
        }
        else {
            this._tokens.add(token);
            this._syncToElement();
            return true;
        }
    }
    toString() {
        return Array.from(this._tokens).join(' ');
    }
    /**
     * 将内部状态同步回元素的 class 属性
     */
    _syncToElement() {
        this._element.className = this.toString();
    }
}
exports.DOMTokenList = DOMTokenList;
//# sourceMappingURL=DOMTokenList.js.map