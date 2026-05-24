# 第 4 章：样式计算 — 谁说了算？

## 本章目标

理解浏览器如何决定一个元素的最终样式。你将看到一条 CSS 声明从"被写出来"到"真正影响像素"的完整路程。

## 4.1 样式计算的四大步骤

```
DOM Element
    │
    ▼
┌─────────────────────┐
│ Step 1: 收集匹配规则  │  遍历所有样式表，检查每条规则的选择器是否匹配
├─────────────────────┤
│ Step 2: 层叠排序      │  来源(UA/Author) → !important → 特异性 → 顺序
├─────────────────────┤
│ Step 3: 继承默认值    │  没被声明的属性从父元素继承或使用初始值
├─────────────────────┤
│ Step 4: 值计算        │  em→px、百分比、简写展开
└─────────────────────┘
    │
    ▼
 ComputedStyle（约 50 个属性，全部绝对值）
```

> Chrome 源码对应：`StyleResolver::StyleForElement()` → `StyleCascade::Apply()`

## 4.2 选择器匹配：从右向左

打开 `packages/style/src/SelectorMatcher.ts`，核心算法：

```typescript
export function matchesSelector(selector: ComplexSelector, element: IElement): boolean {
  // 从右向左匹配！
  let compoundIndex = compounds.length - 1;
  let currentElement = element;

  // 最右边的复合选择器必须匹配目标元素
  if (!matchesCompound(compounds[compoundIndex], currentElement)) {
    return false;
  }

  // 然后向左检查组合器和复合选择器
  while (compoundIndex >= 0) {
    const combinator = combinators[compoundIndex];
    const nextElement = findMatchingAncestor(
      compounds[compoundIndex], currentElement, combinator
    );
    if (!nextElement) return false;
    currentElement = nextElement;
    compoundIndex--;
  }
  return true;
}
```

**为什么要从右向左？** 

```
图解：从右向左匹配  div.container > p + span

  选择器结构:  [div.container]  >  [p]  +  [span]
                  复合1         复合2       复合3
                   ←── 匹配方向（从右向左）──←

  Step 1: 目标元素是 <span> ?
          ├─ 不是 → 直接返回 false（省去祖先检索）
          └─ 是 ✓ → 继续

  Step 2: 向上找匹配 [p] 且满足邻接兄弟(+)
          ├─ 前一个兄弟是 <p> ? ✓ → 继续
          └─ 不是 → false

  Step 3: 向上找匹配 [div.container] 且满足父子(>)
          ├─ 父元素是 <div.container> ? ✓ → 匹配成功！
          └─ 不是 → false

  为什么从右向左？
  • 最右边的选择器直接针对目标元素，能最快淘汰不匹配
  • Chrome 还用 Bloom filter 预判，连 DOM 树都不用走
```

以 `div.container > p + span` 为例：

1. 先检查目标元素是不是 `span` → 不是？直接返回 false，省去祖先检索
2. 是 span？向左找 `p` + 邻接兄弟关系
3. 找到了 p？再向左找 `div.container` + 父子关系

Chrome 的 `SelectorChecker` 还用了 Bloom filter 加速——提前判断某个祖先不可能匹配，直接跳过 DOM 遍历。

## 4.3 层叠排序：六层优先级

`packages/style/src/StyleResolver.ts:120`

```typescript
private getCascadePriority(origin: StyleOrigin, important: boolean): number {
  if (important) {
    switch (origin) {
      case StyleOrigin.AUTHOR:       return 4; // 作者 !important
      case StyleOrigin.USER:         return 5; // 用户 !important
      case StyleOrigin.USER_AGENT:   return 6; // UA !important  最高！
    }
  } else {
    switch (origin) {
      case StyleOrigin.USER_AGENT:   return 0; // UA 普通    最低
      case StyleOrigin.USER:         return 1;
      case StyleOrigin.AUTHOR:       return 2; // 作者普通
    }
  }
}
```

记忆口诀：**UA 普通 < 用户普通 < 作者普通 < 作者 !important < 用户 !important < UA !important**

```
  层叠优先级阶梯（数字越大越优先）
  ┌──────────────────────────────────────┐
  │ 7 │ UA !important    最高           │  e.g. 浏览器强行限制
  │ 6 │ 用户 !important                 │  e.g. 用户强制字体大小
  │ 5 │ 作者 !important                 │  e.g. color: red !important
  │ 4 │ 动画（暂不支持）                 │
  │ 3 │ 作者普通                         │  e.g. p { color: blue }
  │ 2 │ 用户普通                         │  e.g. 用户自定义样式表
  │ 1 │ UA 普通                          │  e.g. body { margin: 8px }
  │ 0 │ 默认值 / 继承值                  │  所有属性的起点
  └──────────────────────────────────────┘
```

同一优先级内，比特异性 `[a,b,c]`（第 3 章学的）。相同特异性，比源码顺序（后出现的覆盖）。

### 实际案例

```html
<style>
  p { color: blue; }          /* 作者普通，特异性 [0,0,1] */
  #content p { color: red; }  /* 作者普通，特异性 [1,0,1] */
</style>
<p id="content">什么颜色？</p>
```

解答：
1. 两条规则都是 AUTHOR 普通（优先级 2）
2. 比特异性：`#content p` 是 `[1,0,1]`，`p` 是 `[0,0,1]` → `[1,0,1]` 胜
3. 最终颜色：**红色**

## 4.4 继承：省去重复声明

```css
body { color: #333; font-size: 16px; }
/* 所有 p, span, a 自动继承这两个属性 */
```

不是所有属性都继承。打开 `packages/style/src/ComputedStyleDefaults.ts`：

```typescript
export const INHERITED_PROPERTIES = new Set([
  'color',        // 会继承
  'fontSize',     // 会继承
  'fontFamily',   // 会继承
  'lineHeight',   // 会继承
  'textAlign',    // 会继承
]);
```

**经验法则**：排版相关属性（字体、颜色、对齐）大多继承；盒模型属性（margin、padding、border）不继承。

## 4.5 值计算：em → px

`packages/style/src/StyleResolver.ts:265`

```typescript
function resolveToPx(value: CSSValue, fontSize: number): number {
  switch (value.unit) {
    case 'px': return value.value;       // 直接使用
    case 'em': return value.value * fontSize;  // 乘以当前 fontSize
    case 'rem': return value.value * 16;       // 乘以根 fontSize（默认 16px）
    case 'pt': return value.value * 4 / 3;     // 1pt = 1.333px
  }
}
```

计算后，ComputedStyle 中所有长度都是绝对值（px）。布局引擎拿到的是 "这个元素的 padding-top 是 20"，而不是 "20px 还是 2em？"。

## 4.6 跟着调试器走一遍

```bash
npx ts-node -P packages/style/tsconfig.json packages/style/tests/verify.ts
```

输出会展示每个元素的 `computedStyle`：
- h1 的颜色是红色（来自作者样式 `h1.title { color: red }`）
- strong 的颜色是绿色（来自作者样式 `strong { color: green }`）
- span 继承了父元素的样式，再叠加自己的 `color: blue`

## 练习题

1. 写一个 HTML + CSS 组合，让 `<div id="a"><span id="b"></span></div>` 中的 span 最终 `font-size` 为 24px，条件是 span 自身没有设置 `font-size`
2. 同一元素上，`style=""` 内联样式和 `!important` 谁的优先级高？为什么？
3. 修改 `matchesSelector`，让它支持 `:nth-child(2n+1)` 伪类

> 下一章：[布局引擎](./05-layout-engine.md) — 从样式到坐标
