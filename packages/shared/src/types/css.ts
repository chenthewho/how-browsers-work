/**
 * CSS 类型定义
 *
 * 对应 Chrome/Blink 中的 third_party/blink/renderer/core/css/
 * 定义了 CSS 解析后的 AST 结构，以及样式表的表示
 */

// ============================================================
// 样式来源 —— 决定层叠优先级
// 对应 CSS 规范中的 origin，Chrome 中由 StyleSheetContents 管理
// 优先级（从高到低）：
//   用户代理 !important > 用户 !important > 作者 !important >
//   作者普通 > 用户普通 > 用户代理普通
// ============================================================
export enum StyleOrigin {
  USER_AGENT = 'user-agent',   // 浏览器内置样式，如 body { margin: 8px }
  AUTHOR = 'author',           // 网页作者写的样式
  USER = 'user',               // 用户自定义样式
}

// ============================================================
// StyleSheet —— 一个完整的样式表
// 对应 Blink 的 StyleSheetContents
// ============================================================
export interface StyleSheet {
  rules: StyleRule[];          // 样式规则列表
  origin: StyleOrigin;         // 样式来源
}

// ============================================================
// StyleRule —— 一条 CSS 规则
// 例如：h1, h2.title { color: red; font-size: 16px; }
// 一条规则可以有多个选择器（选择器列表）和多个声明（声明列表）
// ============================================================
export interface StyleRule {
  selectors: ComplexSelector[];     // 选择器列表，如 [h1, h2.title]
  declarations: CSSDeclaration[];   // 声明列表，如 [{color: red}, {font-size: 16px}]
  // 来源通过所属的 StyleSheet 确定
}

// ============================================================
// CSSDeclaration —— 一个 CSS 声明（属性-值对）
// 例如：color: red
// ============================================================
export interface CSSDeclaration {
  property: string;       // 属性名，如 "color"
  value: CSSValue;        // 解析后的第一个值（向后兼容）
  values?: CSSValue[];    // 多值属性的完整值列表，如 margin: 30px auto → [30px, auto]
  important: boolean;     // 是否有 !important 标记
}

// ============================================================
// ComplexSelector —— 复杂选择器（复合选择器 + 组合器）
// 例如：div.container > p + span
// 这个选择器由三个 CompoundSelector 和两个 Combinator 组成
// ============================================================
export interface ComplexSelector {
  // 组成部分（如 div.container, p, span）按从左到右的顺序
  compounds: CompoundSelector[];
  // 连接各部分的组合器（长度 = compounds.length - 1）
  combinators: Combinator[];
  // 预计算的特异性 [a, b, c]
  // a = ID 选择器数量
  // b = 类/属性/伪类选择器数量
  // c = 类型/伪元素选择器数量
  specificity: SpecificityTuple;
}

// ============================================================
// CompoundSelector —— 复合选择器（不含组合器的部分）
// 例如：div.container#main[data-x="y"]:hover
// 一个复合选择器由标签名、ID、类名、属性、伪类等组成
// 它们之间没有空格/组合器连接，表示"同时满足所有条件"
// ============================================================
export interface CompoundSelector {
  tagName: string | null;          // 标签名，null 表示通用选择器 *
  id: string | null;               // ID，如 "main"
  classes: string[];               // 类名列表，如 ["container"]
  attributes: AttributeSelector[]; // 属性选择器
  pseudoClasses: PseudoClass[];    // 伪类
}

// ============================================================
// Combinator —— 选择器组合器
// 连接两个复合选择器，表示它们之间的 DOM 关系
// ============================================================
export type Combinator =
  | 'descendant'          // 空格：祖先-后代关系
  | 'child'               // >：直接父子关系
  | 'adjacent-sibling'    // +：紧邻兄弟关系
  | 'general-sibling';    // ~：后续兄弟关系

// ============================================================
// AttributeSelector —— 属性选择器
// 例如：[data-x] [data-x="y"] [data-x~="y"]
// ============================================================
export interface AttributeSelector {
  name: string;               // 属性名
  operator: '=' | '~=' | '|=' | '^=' | '$=' | '*=' | null;  // 匹配操作符
  value: string | null;       // 匹配值（仅存在性检查时为 null）
}

// ============================================================
// PseudoClass —— 伪类
// 例如：:hover :first-child :nth-child(2n+1)
// ============================================================
export interface PseudoClass {
  name: string;                  // 伪类名，如 "hover", "first-child"
  argument: string | null;       // 参数（如 nth-child 的 "2n+1"）
}

// ============================================================
// 特异性元组 [a, b, c]
// 对应 https://www.w3.org/TR/selectors-3/#specificity
// a: ID 选择器数量
// b: 类选择器、属性选择器、伪类选择器数量
// c: 类型选择器、伪元素选择器数量
// 内联样式被视为 [1, 0, 0]（不在选择器中计算，单独处理）
// ============================================================
export type SpecificityTuple = [number, number, number];

// ============================================================
// CSSValue —— CSS 值的联合类型
// 对应 CSS 规范中的各种值类型
// ============================================================
export type CSSValue =
  | { type: 'keyword'; value: string }                          // auto, inherit, initial 等
  | { type: 'length'; value: number; unit: LengthUnit }         // 16px, 2em, 100%
  | { type: 'color'; r: number; g: number; b: number; a: number } // #ff0000, rgb(), red
  | { type: 'percentage'; value: number }                       // 50%
  | { type: 'string'; value: string }                           // "hello"
  | { type: 'number'; value: number }                           // 1, 2.5
  | { type: 'function'; name: string; args: CSSValue[] };       // rgb(255,0,0), calc(100%-10px)

// ============================================================
// LengthUnit —— CSS 长度单位
// ============================================================
export type LengthUnit = 'px' | 'em' | 'rem' | 'vw' | 'vh' | '%' | 'pt';
