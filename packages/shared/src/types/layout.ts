/**
 * 布局类型定义
 *
 * 对应 Chrome/Blink 中的 third_party/blink/renderer/core/layout/
 * 定义了布局盒子的结构和样式计算后的类型
 */

// ============================================================
// 布局模式 —— 决定使用哪种布局算法
// ============================================================
export enum LayoutMode {
  BLOCK = 'block',          // 块级格式化上下文（BFC）
  INLINE = 'inline',        // 行内格式化上下文（IFC）
  FLEX = 'flex',            // Flex 布局
}

// ============================================================
// EdgeSizes —— 盒模型每层边框的大小
// 用于 margin、border、padding，每边四个值
// 对应 Blink 的 PhysicalBoxStrut / BoxStrut
// ============================================================
export interface EdgeSizes {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// ============================================================
// Rect —— 矩形，表示盒子的位置和大小
// x, y 是相对于包含块内容区左上角的偏移
// ============================================================
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================
// LayoutBox —— 布局盒子
//
// 对应 Blink 的 LayoutBox / LayoutObject
// Chrome 中，Render Tree（也叫 Layout Tree）由 LayoutObject 组成
// 每个 LayoutObject 对应一个可视的 DOM 元素
// 不可视元素（head, script, display:none）不会产生 LayoutBox
//
// 布局引擎负责：
// 1. 从 DOM 树构造 LayoutBox 树（跳过了非可视节点）
// 2. 为每个 LayoutBox 设置 ComputedStyle
// 3. 计算每个 LayoutBox 的位置和大小
// ============================================================
export interface LayoutBox {
  id: string;                          // 唯一标识
  element: import('./dom').IElement | null;  // 对应的 DOM 元素（匿名盒子为 null）

  // --- 位置和尺寸（布局引擎计算的核心结果）---
  // rect 表示 content area（内容区）的位置和大小
  // x, y 相对于包含块（containing block）内容区的左上角
  rect: Rect;

  // --- 盒模型四层 ---
  margin: EdgeSizes;   // 外边距
  border: EdgeSizes;   // 边框宽度
  padding: EdgeSizes;  // 内边距

  // --- 布局模式 ---
  layoutMode: LayoutMode;

  // --- 树结构 ---
  parent: LayoutBox | null;
  children: LayoutBox[];

  // --- 文本内容（仅文本盒子有值，即 inline text box）---
  textContent: string | null;

  // --- 计算后的样式（从 StyleResolver 获得）---
  style: import('./dom').IComputedStyle;
}

// ============================================================
// LineBox —— 行盒子
//
// 在行内格式化上下文（IFC）中，行内元素被分配到多个行盒子中
// 一个行盒子对应一行文本
// ============================================================
export interface LineBox {
  y: number;                     // 行盒子的 Y 坐标
  height: number;                // 行高
  baseline: number;              // 基线位置
  fragments: InlineFragment[];   // 行内片段
}

// ============================================================
// InlineFragment —— 行内片段
//
// 一个行内元素可能被拆分到多行（比如长文本换行）
// 每个片段记录了该部分的位置和大小
// ============================================================
export interface InlineFragment {
  layoutBox: LayoutBox;   // 对应的布局盒子
  x: number;              // 在行内的 X 偏移
  y: number;              // 在行内的 Y 偏移
  width: number;          // 片段宽度
  height: number;         // 片段高度
  baseline: number;       // 基线偏移
}

// ============================================================
// 序列化后的布局盒子（JSON 安全，无循环引用）
// 用于 IPC 传输和文本输出
// ============================================================
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
