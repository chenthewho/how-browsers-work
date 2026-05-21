# 第 3 章：CSS 解析器 — 选择器、属性、值

## 本章目标

理解 CSS 文本如何被解析成浏览器可操作的数据结构。

## 3.1 CSS 也要"编译"

CSS 看上去比 HTML 简单，但它的解析同样需要词法分析 + 语法分析：

```
CSS 字符串
   │
   ▼
┌──────────────┐
│ CSSTokenizer  │ 字符 → Token 流
│ 18 种 token   │ #id, .class, 16px, rgb(), { } : ;
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ CSSParser     │ Token → StyleSheet AST
│               │ 规则列表 + 选择器 + 声明
└──────┬───────┘
       │
       ▼
┌──────────────┐
│SelectorParser │ 选择器字符串 → 结构化选择器
│               │ ComplexSelector = CompoundSelector[] + Combinator[]
└──────────────┘
```

## 3.2 CSS 词法分析

打开 `packages/css-parser/src/CSSTokenizer.ts`：

```typescript
// 18 种 token 类型
enum CSSTokenType {
  IDENT,        // div, color, red
  FUNCTION,     // rgb(, calc(
  AT_KEYWORD,   // @media
  HASH,         // #main, #fff
  STRING,       // "hello"
  NUMBER,       // 16
  PERCENTAGE,   // 50%
  DIMENSION,    // 16px, 2em
  COLON,        // :
  SEMICOLON,    // ;
  // ...
}
```

### 跟着 tokenizer 走一遍

以 `h1 { color: red; font-size: 16px; }` 为例：

```
Token 流：
IDENT "h1"
WHITESPACE
OPEN_BRACE "{"
WHITESPACE
IDENT "color"
COLON ":"
WHITESPACE
IDENT "red"
SEMICOLON ";"
WHITESPACE
IDENT "font-size"
COLON ":"
WHITESPACE
DIMENSION "16px" (value:16, unit:"px")
SEMICOLON ";"
WHITESPACE
CLOSE_BRACE "}"
EOF
```

## 3.3 CSS 语法分析

`packages/css-parser/src/CSSParser.ts`

语法分析器的任务是把 flat 的 token 流变成结构化数据。核心方法：

```typescript
parse(cssText: string, origin: StyleOrigin): StyleSheet {
  // 遍历所有 token，识别规则
  while (!this.isEOF()) {
    const rule = this.parseRule();
    if (rule) rules.push(rule);
  }
  return { rules, origin };
}
```

### 一条规则的结构

```css
h1, h2.title { color: red; font-size: 16px; }
```

解析后变成：

```typescript
{
  selectors: [
    ComplexSelector { compounds: [{ tagName: 'h1' }], combinators: [], specificity: [0,0,1] },
    ComplexSelector { compounds: [{ tagName: 'h2' }, { classes: ['title'] }], ... }
  ],
  declarations: [
    { property: 'color',       value: { type:'color', r:255, g:0, b:0, a:1 } },
    { property: 'font-size',   value: { type:'length', value:16, unit:'px' } },
  ]
}
```

## 3.4 选择器解析器：理解连字符组合器

`packages/css-parser/src/SelectorParser.ts`

这是 CSS 最精妙的部分。看这个选择器：

```css
div.container > p + span
```

它的结构是：

```
ComplexSelector
├── CompoundSelector[0]: { tagName: 'div', classes: ['container'] }
├── Combinator[0]: 'child' (>)
├── CompoundSelector[1]: { tagName: 'p' }
├── Combinator[1]: 'adjacent-sibling' (+)
└── CompoundSelector[2]: { tagName: 'span' }
```

### 组合器的四种关系

| 符号 | 组合器类型 | DOM 关系 |
|---|---|---|
| 空格 | `descendant` | 祖先-后代（任意深度） |
| `>` | `child` | 直接父子 |
| `+` | `adjacent-sibling` | 紧邻兄弟 |
| `~` | `general-sibling` | 后续所有兄弟 |

### 特异性计算

```typescript
function compoundToSpecificity(compound: CompoundSelector): [number,number,number] {
  let a = 0, b = 0, c = 0;
  if (compound.id) a++;                    // ID: +1,0,0
  b += compound.classes.length;           // class: +0,1,0
  b += compound.attributes.length;        // [attr]: +0,1,0
  b += compound.pseudoClasses.length;     // :hover: +0,1,0
  if (compound.tagName) c++;              // tag: +0,0,1
  return [a, b, c];
}
```

**记口诀**：ID/类+属性+伪类/标签。内联样式相当于 `[1,0,0]`，`!important` 在此基础上再加一层。

## 3.5 属性值的奥秘

CSS 值比看起来复杂。`padding: 20px` 是一个简写——它实际上设置了 4 个属性：`padding-top`、`padding-right`、`padding-bottom`、`padding-left`。

浏览器内部把所有值都解析为**绝对值**：

| CSS 写法 | 内部存储 |
|---|---|
| `16px` | `{ type:'length', value:16, unit:'px' }` |
| `2em` | `{ type:'length', value:2, unit:'em' }` → 计算后变成 32px（如果父元素 fontSize=16px） |
| `red` | `{ type:'color', r:255, g:0, b:0, a:1 }` |
| `#ff0000` | 同上 |
| `rgb(255,0,0)` | 同上 |
| `auto` | `{ type:'keyword', value:'auto' }` |

## 3.6 用户代理样式表：浏览器的"出厂设置"

打开 `packages/style/src/user-agent.ts`，你在看的是**浏览器的内置 CSS**。Chrome 中这个文件叫 `html.css`，放在 Chromium 源码里：

```css
body { margin: 8px; }          /* 为什么 body 默认有 8px 间距？就是这个 */
h1 { font-size: 2em; font-weight: bold; }  /* h1 为什么默认加粗放大？ */
head, script, style { display: none; }     /* 为什么这些标签不显示？ */
```

这些样式的优先级最低（`StyleOrigin.USER_AGENT`），网页作者写的任何样式都能覆盖它们。

## 练习题

1. 用 `SelectorParser` 解析 `.container > ul li:first-child`，画出完整的结构
2. 计算 `#main .content p.highlight` 的特异性 `[a,b,c]`
3. 写一个 CSS tokenizer 输出 `margin: 10px 20px 30px 40px` 的完整 token 流

> 下一章：[样式计算](./04-style-resolution.md) — 层叠、特异性争夺战、继承
