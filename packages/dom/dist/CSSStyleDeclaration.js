"use strict";
/**
 * CSSStyleDeclaration —— element.style 的实现
 *
 * 对应 Chrome/Blink 中的 blink::CSSStyleDeclaration
 * 管理内联样式，通过 camelCase 属性访问
 *
 * 例如：element.style.color = 'red'
 *       element.style.backgroundColor = 'blue'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSStyleDeclarationBase = void 0;
exports.createCSSStyleDeclaration = createCSSStyleDeclaration;
class CSSStyleDeclarationBase {
    // 内部用 Map 存储 CSS 属性值
    _properties = new Map();
    _element;
    constructor(element) {
        this._element = element;
    }
    /**
     * cssText: 获取或设置完整的样式字符串
     * 例如："color: red; font-size: 16px"
     */
    get cssText() {
        const result = [];
        this._properties.forEach((value, key) => {
            result.push(`${key}: ${value}`);
        });
        return result.join('; ');
    }
    set cssText(value) {
        this._properties.clear();
        // 解析分号分隔的属性
        for (const part of value.split(';')) {
            const trimmed = part.trim();
            if (!trimmed)
                continue;
            const colonIdx = trimmed.indexOf(':');
            if (colonIdx === -1)
                continue;
            const prop = trimmed.substring(0, colonIdx).trim();
            const val = trimmed.substring(colonIdx + 1).trim();
            this._properties.set(prop, val);
        }
    }
    getPropertyValue(property) {
        return this._properties.get(property) || '';
    }
    setProperty(property, value) {
        this._properties.set(property, value);
    }
    removeProperty(property) {
        const oldValue = this._properties.get(property) || '';
        this._properties.delete(property);
        return oldValue;
    }
}
exports.CSSStyleDeclarationBase = CSSStyleDeclarationBase;
/**
 * 创建带 Proxy 的 CSSStyleDeclaration，支持动态属性
 * 例如：style.color = 'red' 和 style['background-color'] = 'blue'
 */
function createCSSStyleDeclaration(element) {
    const decl = new CSSStyleDeclarationBase(element);
    return new Proxy(decl, {
        get(target, prop) {
            // 如果属性在实例上存在，直接返回
            if (prop in target) {
                return target[prop];
            }
            // 否则当作 CSS 属性名处理（camelCase → kebab-case 转换）
            const cssProp = camelToKebab(prop);
            return target.getPropertyValue(cssProp);
        },
        set(target, prop, value) {
            if (prop in target) {
                target[prop] = value;
            }
            else {
                const cssProp = camelToKebab(prop);
                target.setProperty(cssProp, value);
            }
            return true;
        },
    });
}
/**
 * camelCase → kebab-case 转换
 * 例如：backgroundColor → background-color
 */
function camelToKebab(str) {
    return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
//# sourceMappingURL=CSSStyleDeclaration.js.map