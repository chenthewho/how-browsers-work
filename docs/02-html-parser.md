# 第 2 章：HTML 解析器 — 把字符串变成 DOM 树

## 本章目标

理解浏览器如何把一段 HTML 文本解析成第 1 章学到的 DOM 树。你会亲手调试一个真实的 HTML 词法分析器 + 树构造器。

## 2.1 两阶段解析

HTML 解析不是一步完成的，而是分两个阶段：

```
HTML 字符串
   │
   ▼
┌──────────────┐
│ 阶段 1：词法分析  │  Tokenizer（状态机）
│ 字符 → Token    │  约 25 个状态
└──────┬───────┘
       │  StartTag / EndTag / Character / Comment ...
       ▼
┌──────────────┐
│ 阶段 2：树构造   │  TreeBuilder（状态机）
│ Token → DOM    │  约 9 个插入模式
└──────┬───────┘
       │
       ▼
    DOM Tree
```

> 这种两阶段设计在编译原理中叫"前端"，几乎所有编程语言编译器的第一步都是这样做的。
> Chrome 源码对应：`HTMLTokenizer` + `HTMLTreeBuilder`

## 2.2 词法分析器：25 个状态的战士

### 图解：哪些状态最常用？

```
                    ┌──────────────────────────────────────────────┐
                    │               DATA（主状态）                    │
                    │         所有普通文本在这里处理                    │
                    └────┬──────────────────┬───────────────────────┘
                         │ 看到 <           │ 看到 &
           ┌─────────────▼──────────┐      └──→ 字符引用处理
           │     TAG_OPEN            │
           │    < 后面是什么？        │
           └──┬──────────┬──────────┘
              │ 字母      │ /
    ┌─────────▼─────┐  ┌─▼────────────┐
    │  TAG_NAME      │  │ END_TAG_OPEN │
    │  读 div/p/...  │  │  读 /div...  │
    └──┬─────────────┘  └──┬───────────┘
       │ > 发射 StartTag   │ > 发射 EndTag
       │ 空格 → 属性解析    │
       │                   │
  ┌────▼─────────────┐     │
  │ BEFORE_ATTR_NAME  │     │
  │ ↓                 │     │
  │ ATTR_NAME         │     │
  │ ↓                 │     │
  │ BEFORE_ATTR_VALUE │     │
  │ ↓                 │     │
  │ ATTR_VALUE_DQ/SQ  │     │
  │ ↓                 │     │
  │ AFTER_ATTR_NAME ──┼─────┘
  └──────────────────┘
  
  此外还有 COMMENT、DOCTYPE、RAWTEXT、RCDATA 等状态。
  这 25 个状态完整实现了 HTML5 Tokenizer 规范。
```

打开 `packages/html-parser/src/Tokenizer.ts`，你会看到一个巨大的状态机：

```typescript
enum State {
  DATA,           // 默认状态："在标签外"
  TAG_OPEN,       // 刚读到 <
  TAG_NAME,       // 正在读标签名
  BEFORE_ATTR_NAME, // 准备读属性名
  ATTR_NAME,      // 正在读属性名
  ATTR_VALUE_DQ,  // 双引号属性值
  ATTR_VALUE_SQ,  // 单引号属性值
  ATTR_VALUE_UQ,  // 无引号属性值
  // ... 约 25 个状态
}
```

### 跟踪一个真实的解析过程

以 `<div id="main">Hello</div>` 为例：

```
字符        当前状态        动作
─────────────────────────────────────
<          DATA          → 切换到 TAG_OPEN
d          TAG_OPEN      → 创建 StartTag token，切换到 TAG_NAME
i,v        TAG_NAME      → 追加到标签名 "div"
[空格]      TAG_NAME      → 标签名完毕，切换到 BEFORE_ATTR_NAME
i          BEFORE_ATTR_NAME → 创建属性，切换到 ATTR_NAME
d          ATTR_NAME     → 追加到属性名 "id"
=          ATTR_NAME     → 切换到 BEFORE_ATTR_VALUE
"          BEFORE_ATTR_VALUE → 切换到 ATTR_VALUE_DQ
m,a,i,n    ATTR_VALUE_DQ → 追加到属性值 "main"
"          ATTR_VALUE_DQ → 值结束，切换到 AFTER_ATTR_NAME
>          AFTER_ATTR_NAME → 发射 StartTag token！回到 DATA
H,e,l,l,o  DATA          → 累积到字符缓冲区
<          DATA          → 发射 Character token("Hello")，切换到 TAG_OPEN
/          TAG_OPEN      → 切换到 END_TAG_OPEN
d,i,v      END_TAG_OPEN  → 创建 EndTag token，切换到 TAG_NAME
>          TAG_NAME      → 发射 EndTag token
EOF        DATA          → 发射 EOF token
```

### 关键代码

```typescript
// Tokenizer.ts:240 — handleTagOpen
private handleTagOpen(ch: string): void {
  if (ch === '!') {
    this.state = State.MARKUP_DECL_OPEN;  // <!-- 或 <!DOCTYPE
  } else if (ch === '/') {
    this.state = State.END_TAG_OPEN;      // </div>
  } else if (isLetter(ch)) {
    this.currentToken = createStartTagToken(ch);  // <div
    this.state = State.TAG_NAME;
  } else {
    this.buffer += '<';     // < 后不是合法字符，当作普通文本
    this.reconsume = true;  // 重新处理当前字符
    this.state = State.DATA;
  }
}
```

## 2.3 树构造器：9 个插入模式

`packages/html-parser/src/TreeBuilder.ts`

词法分析器吐出 token，树构造器负责把这些 token 变成 DOM 操作。它的核心是一个**开放元素栈**：

```typescript
// 栈底是 html，栈顶是最近打开的元素
private openElements: IElement[] = [];
```

插入模式决定了如何处理不同类型的 token：

| 插入模式 | 场景 | 处理哪些标签 |
|---|---|---|
| INITIAL | 解析开始 | `<!DOCTYPE>` |
| BEFORE_HTML | 在 `<html>` 之前 | `<html>` |
| BEFORE_HEAD | 在 `<head>` 之前 | `<head>` |
| IN_HEAD | 在 `<head>` 内 | `<title>`, `<meta>`, `<link>` 等 |
| AFTER_HEAD | `<head>` 之后 | `<body>`, `<frameset>` |
| **IN_BODY** | **最常用** | `div`, `p`, `h1`, `span`, 几乎所有 |
| IN_TABLE | `<table>` 内 | `tr`, `td`, `thead` 等 |
| TEXT | `<title>`/`<style>` 内 | 纯文本内容 |

### 实际跟踪：`<table><tr><td>Hi</td></tr></table>`

1. `<table>` — 在 IN_BODY 模式，切换到 IN_TABLE
2. `<tr>` — 在 IN_TABLE 模式，隐式创建 `<tbody>`，插入 `<tr>`，切换到 IN_ROW
3. `<td>` — 在 IN_ROW 模式，插入 `<td>`，切换到 IN_CELL
4. `Hi` — 在 IN_CELL 模式，创建文本节点
5. `</td>` — 弹出 td，回到 IN_ROW
6. `</tr>` — 弹出 tr，回到 IN_TABLE_BODY
7. `</table>` — 弹出 table，回到 IN_BODY

### 隐式元素创建

最精彩的部分：HTML 规范允许省略某些标签，解析器会自动补全：

```typescript
// TreeBuilder.ts:283
if (tagName === 'tr') {
  this.closePElement();
  this.createImpliedElement('tbody');  // 自动创建 <tbody>！
  this.insertElementAndPush(token);
}

if (tagName === 'td' || tagName === 'th') {
  this.createImpliedElement('tr');     // 自动创建 <tr>！
  this.insertElementAndPush(token);
}
```

这就是为什么你可以写 `<table><tr>...` 而不写 `<tbody>`——浏览器帮你加了。

### 图解：开放元素栈的变化

```
  解析 <html><head><title>Hello</title></head><body><div>

  时间线      开放元素栈 (openElements)          插入模式
  ─────────────────────────────────────────────────────────
  DOCTYPE     []                              INITIAL→BEFORE_HTML
  <html>      [html]                          BEFORE_HTML→BEFORE_HEAD
  <head>      [html, head]                    BEFORE_HEAD→IN_HEAD
  <title>     [html, head, title]             IN_HEAD→TEXT
  "Hello"     [html, head, title]             TEXT（字符追加到 title）
  </title>    [html, head]                    TEXT→IN_HEAD
  </head>     [html]                          IN_HEAD→AFTER_HEAD
  <body>      [html, body]                    AFTER_HEAD→IN_BODY
  <div>       [html, body, div]               IN_BODY
  </div>      [html, body]                    IN_BODY
  </body>     [html, body]                    IN_BODY（保持）
  </html>     [html, body]                    IN_BODY（忽略）

                           栈底 → 栈顶
  关键规则：
  • 新元素 push，结束标签 pop
  • 当前节点 = 栈顶元素
  • <body> 遇到 <tr>：自动 push tbody → tr
  • <p> 遇到 <div>：自动 pop p（p 不能嵌套块级元素）
```

## 2.4 运行验证

```bash
# 看 tokenizer 输出什么 token
npx ts-node -P packages/html-parser/tsconfig.json packages/html-parser/tests/verify.ts
```

它会解析一个完整的 HTML 页面，验证：
- DOCTYPE 处理
- head/body 结构
- id/class 属性
- 表格元素
- 嵌套深度

## 2.5 常见坑：为什么 `<title>` 是个特例？

`<title>` 和 `<style>` 的内容是 **RCDATA/RAWTEXT**，不是普通的 HTML。这意味着里面的 `<` 和 `>` 不会被当作标签：

```html
<title>a < b</title>      <!-- 里面的 < 是文本，不是标签开始 -->
<style>div { color: red }</style>  <!-- 里面可能有 > 但不是标签 -->
```

我们的 tokenizer 专门处理了这种情况：

```typescript
// Tokenizer.ts — 当进入 <title>/<textarea> 时
private handleRcdata(ch: string): void {
  if (ch === '<') {
    // 可能是 </title> 结束标签
    this.flushCharacterBuffer();
    this.state = State.RCDATA_LESS_THAN;
  } else {
    this.buffer += ch;  // 普通字符，包括 < > 都当文本
  }
}
```

## 练习题

1. 用纸笔画出 `<p class="intro">Hello <strong>world</strong></p>` 的完整 tokenizer 状态转换
2. 修改 tokenizer，让 `<custom-tag>` 这样的自定义标签也能被正确解析
3. 思考：如果解析过程中遇到 `</p>` 但栈中没有 `<p>`，树构造器应该怎么做？

> 下一章：[CSS 解析器](./03-css-parser.md) — 把 CSS 文本变成结构化的样式表
