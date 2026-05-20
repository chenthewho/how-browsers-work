/**
 * CSS 类型定义
 *
 * 对应 Chrome/Blink 中的 third_party/blink/renderer/core/css/
 * 定义了 CSS 解析后的 AST 结构，以及样式表的表示
 */
export declare enum StyleOrigin {
    USER_AGENT = "user-agent",// 浏览器内置样式，如 body { margin: 8px }
    AUTHOR = "author",// 网页作者写的样式
    USER = "user"
}
export interface StyleSheet {
    rules: StyleRule[];
    origin: StyleOrigin;
}
export interface StyleRule {
    selectors: ComplexSelector[];
    declarations: CSSDeclaration[];
}
export interface CSSDeclaration {
    property: string;
    value: CSSValue;
    important: boolean;
}
export interface ComplexSelector {
    compounds: CompoundSelector[];
    combinators: Combinator[];
    specificity: SpecificityTuple;
}
export interface CompoundSelector {
    tagName: string | null;
    id: string | null;
    classes: string[];
    attributes: AttributeSelector[];
    pseudoClasses: PseudoClass[];
}
export type Combinator = 'descendant' | 'child' | 'adjacent-sibling' | 'general-sibling';
export interface AttributeSelector {
    name: string;
    operator: '=' | '~=' | '|=' | '^=' | '$=' | '*=' | null;
    value: string | null;
}
export interface PseudoClass {
    name: string;
    argument: string | null;
}
export type SpecificityTuple = [number, number, number];
export type CSSValue = {
    type: 'keyword';
    value: string;
} | {
    type: 'length';
    value: number;
    unit: LengthUnit;
} | {
    type: 'color';
    r: number;
    g: number;
    b: number;
    a: number;
} | {
    type: 'percentage';
    value: number;
} | {
    type: 'string';
    value: string;
} | {
    type: 'number';
    value: number;
} | {
    type: 'function';
    name: string;
    args: CSSValue[];
};
export type LengthUnit = 'px' | 'em' | 'rem' | 'vw' | 'vh' | '%' | 'pt';
//# sourceMappingURL=css.d.ts.map