/**
 * 布局类型定义
 *
 * 对应 Chrome/Blink 中的 third_party/blink/renderer/core/layout/
 * 定义了布局盒子的结构和样式计算后的类型
 */
export declare enum LayoutMode {
    BLOCK = "block",// 块级格式化上下文（BFC）
    INLINE = "inline",// 行内格式化上下文（IFC）
    FLEX = "flex"
}
export interface EdgeSizes {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface LayoutBox {
    id: string;
    element: import('./dom').IElement | null;
    rect: Rect;
    margin: EdgeSizes;
    border: EdgeSizes;
    padding: EdgeSizes;
    layoutMode: LayoutMode;
    parent: LayoutBox | null;
    children: LayoutBox[];
    textContent: string | null;
    style: import('./dom').IComputedStyle;
}
export interface LineBox {
    y: number;
    height: number;
    baseline: number;
    fragments: InlineFragment[];
}
export interface InlineFragment {
    layoutBox: LayoutBox;
    x: number;
    y: number;
    width: number;
    height: number;
    baseline: number;
}
export interface SerializedLayoutBox {
    id: string;
    tagName: string | null;
    rect: Rect;
    margin: EdgeSizes;
    border: EdgeSizes;
    padding: EdgeSizes;
    layoutMode: string;
    textContent: string | null;
    children: SerializedLayoutBox[];
}
//# sourceMappingURL=layout.d.ts.map