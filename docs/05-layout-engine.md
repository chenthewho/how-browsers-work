# 第 5 章：布局引擎 — 每个像素的位置和尺寸

## 本章目标

理解浏览器如何把 ComputedStyle（抽象值）变成 LayoutBox（具体坐标）。这是整个渲染流水线的**精髓**——从"这个元素应该是什么样"到"这个元素在屏幕上在哪"。

## 5.1 布局解决什么问题

样式计算后，你知道 `div#main` 的 `width: 600px`，但不知道它在屏幕的什么位置。布局引擎的任务：

```
输入：ComputedStyle（每个元素一套）
输出：LayoutBox Tree（每个盒子 x, y, width, height）
```

> Chrome 源码对应：`LayoutBlockFlow::Layout()` / `LayoutInline::Layout()`

## 5.2 两种格式化上下文

打开 `packages/layout/src/LayoutEngine.ts`，核心分派逻辑：

```typescript
private layoutBox(box: LayoutBox, containingBlockWidth: number): void {
  switch (box.layoutMode) {
    case LayoutMode.BLOCK:
      this.layoutBlock(box, containingBlockWidth);  // BFC
      break;
    case LayoutMode.INLINE:
      this.layoutInline(box, containingBlockWidth);  // IFC
      break;
  }
}
```

**BFC（块级格式化上下文）**：
- 盒子垂直堆叠（一个接一个往下放）
- 宽度填满包含块
- 相邻块的垂直 margin 会合并

**IFC（行内格式化上下文）**：
- 盒子水平排列（从做到右放置）
- 放不下了就换行
- 每行高度由最高的行内元素决定

## 5.3 块级布局：垂直堆叠

```typescript
private layoutBlock(box: LayoutBox, containingBlockWidth: number): void {
  let currentY = box.padding.top;
  let previousChildBottomMargin = 0;

  for (const child of blockChildren) {
    // 外边距合并：两个相邻块之间，垂直 margin 取 max
    const collapsedMargin = this.collapseMargins(
      previousChildBottomMargin, child.margin.top
    );

    // 设置子元素的位置
    child.rect.x = box.padding.left + child.margin.left;
    child.rect.y = currentY;

    // 递归布局子元素
    this.layoutBox(child, contentWidth);

    // 向下移动 currentY
    currentY = child.rect.y + child.rect.height
      + child.padding.top + child.padding.bottom
      + child.border.top + child.border.bottom
      + child.margin.bottom;

    previousChildBottomMargin = child.margin.bottom;
  }

  // 盒子高度 = 内容高度 + 底部内边距
  box.rect.height = currentY + box.padding.bottom;
}
```

### 图解：三个块级 div 的垂直排列

```
┌──────────────────────┐
│ 包含块                │  padding-top: 10
│  ┌──────────────────┐ │
│  │ div1             │ │  y = 10+0, margin: 0
│  │ height: 50       │ │
│  └──────────────────┘ │  currentY = 10 + 50 + 0 = 60
│  ┌──────────────────┐ │
│  │ div2             │ │  y = 60+10, margin-top: 10
│  │ height: 30       │ │
│  └──────────────────┘ │  currentY = 70 + 30 + 20 = 120 (margin-bottom: 20)
│  ┌──────────────────┐ │
│  │ div3             │ │  y = 120+(max(20,0)-0), margin-top: 0
│  │                   │ │  div2 的 margin-bottom(20) 和 div3 的 margin-top(0)
│  │                   │ │  合并为 20，所以 y = 120（没有额外间距）
│  └──────────────────┘ │
└──────────────────────┘
```

## 5.4 外边距合并：面试高频考点

```typescript
private collapseMargins(margin1: number, margin2: number): number {
  if (margin1 >= 0 && margin2 >= 0) {
    return Math.max(margin1, margin2);  // 两个正数，取大
  }
  if (margin1 >= 0 && margin2 < 0) {
    return margin1 + margin2;           // 一正一负，相加抵消
  }
  if (margin1 < 0 && margin2 >= 0) {
    return margin1 + margin2;
  }
  return Math.min(margin1, margin2);    // 两个负数，取最小（最负）
}
```

**关键规则**：
- 只有**相邻块级元素**的**垂直** margin 才合并
- `display: flex` 的容器内不合并
- 有 `border` 或 `padding` 隔开的不合并

## 5.5 行内布局：文本流

```typescript
private layoutInlineChildren(container, children, contentWidth, startY): void {
  let currentX = container.padding.left;
  let currentY = startY;

  for (const child of children) {
    if (child.textContent !== null) {
      const textWidth = this.measureText(child.textContent, child.style.fontSize);

      // 放不下了，换行
      if (currentX + textWidth > contentWidth + container.padding.left
          && currentX > container.padding.left) {
        currentX = container.padding.left; // 回到行首
        currentY += maxLineHeight;         // 向下移一行
      }

      child.rect.x = currentX;
      child.rect.y = currentY;
      child.rect.width = textWidth;
      child.rect.height = lineHeight;

      currentX += textWidth;  // 水平前进
    }
  }
}
```

### 图解：文本换行

```
"This is a paragraph with some bold text inside."
┌────────────────────────────────────────────┐
│ This is a paragraph with some bold         │ ← 第一行，宽度超了
│ text inside.                               │ ← 换行
└────────────────────────────────────────────┘
```

## 5.6 文本测量：怎么知道一个字的宽度？

```typescript
private measureText(text: string, fontSize: number): number {
  let width = 0;
  for (const ch of text) {
    if (/[\u4e00-\u9fff]/.test(ch)) {
      width += fontSize;        // 中文字符宽度 ≈ fontSize（等宽）
    } else if (ch === ' ') {
      width += fontSize * 0.3;  // 空格更窄
    } else {
      width += fontSize * 0.6;  // 拉丁字符宽度 ≈ 0.6 × fontSize
    }
  }
  return width;
}
```

Chrome 的真实实现使用 **HarfBuzz** 文本整形引擎 + 字体文件中的字形度量表，能精确到亚像素。我们的简化版本用字符级近似，足以理解原理。

## 5.7 盒模型的计算

每个盒子的最终尺寸由四层组成：

```
┌── margin ──────────────────────────────┐
│  ┌── border ───────────────────────┐   │
│  │  ┌── padding ───────────────┐  │   │
│  │  │  content area            │  │   │
│  │  │  (rect.width × height)   │  │   │
│  │  └──────────────────────────┘  │   │
│  └────────────────────────────────┘   │
└───────────────────────────────────────┘
```

```typescript
// 获取内容区宽度
private getContentWidth(containingBlockWidth: number, box: LayoutBox): number {
  if (style.width !== 'auto') {
    if (style.boxSizing === 'border-box') {
      return style.width; // border-box：width 已包含 padding + border
    }
    return style.width;   // content-box：width 就是内容区宽度
  }
  // auto：填满包含块（减去 margin、padding、border）
  return containingBlockWidth - marginH - paddingH - borderH;
}
```

## 5.8 运行验证

```bash
npx ts-node packages/browser-process/src/BrowserMain.ts \
  --url examples/basic-html/index.html
```

输出中你能看到：
- `pos:(0,0) size:800×288` — 每个盒子的坐标和尺寸
- `m:(30,30,30,30)` — margin（外边距）
- `b:(0,0,0,0)` — border（边框）
- `p:(20,20,20,20)` — padding（内边距）
- `[block]` / `[inline]` — 布局模式
- `TEXT "Hello"` — 文本片段

## 练习题

1. 计算以下场景中 div1 和 div2 之间的真实间距：
```css
.div1 { margin-bottom: 30px; }
.div2 { margin-top: 20px; }
```

2. 修改 `measureText` 方法，让中文字符宽度为 `fontSize * 0.8`，英文为 `fontSize * 0.5`。重新运行看布局变化
3. 给布局引擎添加 `position: absolute` 的支持

> 下一章：[渲染流水线](./06-render-pipeline.md) — 串起所有模块
