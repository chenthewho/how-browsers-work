# 第 1 章：DOM 树 — 浏览器的骨架

## 本章目标

理解浏览器如何用**链表**（不是数组！）来组织 DOM 节点，以及为什么 Chrome 这样设计。

## 1.1 浏览器怎么存 DOM？

你的直觉可能是：

> "DOM 树嘛，每个节点有个 `children: Node[]` 数组，存所有子节点就行。"

但 Chrome 不是这样做的。打开 `packages/dom/src/Node.ts`：

```typescript
// 每个节点只有 4 个指针，没有 children 数组！
parentNode: INode | null;
firstChild: INode | null;
lastChild: INode | null;
previousSibling: INode | null;
nextSibling: INode | null;
```

这就是**双向链表表示法**。每个节点指向它的：
- 父节点
- 第一个子节点
- 最后一个子节点
- 前一个兄弟
- 后一个兄弟

### 为什么用链表而不是数组？

| 操作 | 数组 | 链表 |
|---|---|---|
| `appendChild` | `O(n)` — 需要扩容 | `O(1)` — 直接改指针 |
| `removeChild` | `O(n)` — splice 移动元素 | `O(1)` — 改两个指针 |
| `insertBefore` | `O(n)` — 插入+移动 | `O(1)` — 改指针 |
| 遍历子节点 | `O(n)` — 直接遍历 | `O(n)` — 沿指针走 |

Chrome 需要频繁增删节点，`O(1)` vs `O(n)` 的差距决定了：**用链表**。

> Chrome 源码对应：`third_party/blink/renderer/core/dom/ContainerNode.h`

## 1.2 动手：构建一棵 DOM 树

打开 `packages/dom/tests/verify.ts`，运行它：

```bash
npx ts-node -P packages/dom/tsconfig.json packages/dom/tests/verify.ts
```

代码做的事：

```typescript
const doc = new Document();            // 1. 创建文档根节点
const html = doc.createElement('html'); // 2. 创建 <html>
const body = doc.createElement('body'); // 3. 创建 <body>
const div = doc.createElement('div');   // 4. 创建 <div>

doc.appendChild(html);                  // 5. 组装树
html.appendChild(body);
body.appendChild(div);
```

画成图就是：

```
Document (#document)
 └── HTML
      ├── HEAD (firstChild)
      └── BODY (lastChild)
           └── DIV
                └── TEXT "Hello World"
```

## 1.3 appendChild 的内部原理

看 `packages/dom/src/Node.ts:68`：

```typescript
appendChild(child: INode): INode {
  // 1. 如果 child 已有父节点，先移除（DOM 规范要求）
  if (child.parentNode) {
    child.parentNode.removeChild(child);
  }

  // 2. 建立父子关系
  child.parentNode = this;

  // 3. 链到链表末尾
  if (this.lastChild) {
    child.previousSibling = this.lastChild;  // 新节点的前兄弟 = 原来的最后一个
    this.lastChild.nextSibling = child;      // 原来最后一个的后兄弟 = 新节点
    this.lastChild = child;                  // 更新 lastChild
  } else {
    // 这是第一个子节点
    this.firstChild = child;
    this.lastChild = child;
  }
  return child;
}
```

关键：只需要操作 2-3 个指针，**不涉及任何数组搬移**。

## 1.4 Sibling 指针的精妙

有了 sibling 指针，遍历子节点不需要数组：

```typescript
// 遍历所有子节点（O(n)）
let child = parent.firstChild;
while (child) {
  console.log(child.nodeName);
  child = child.nextSibling; // 沿链表走
}
```

这和 Chrome DevTools 的 Elements 面板看到的 `childNodes` 本质上是一回事——Chrome 只是把链表包装成了类数组。

## 1.5 Document 的工厂角色

`packages/dom/src/Document.ts` 是一个工厂：

```typescript
createElement(tagName: string): IElement {
  const element = new Element(tagName);
  element.ownerDocument = this; // 所有节点都知道自己属于哪个 Document
  return element;
}
```

在 Chrome 中，`Document` 管的是：节点创建、ID 查找、事件分发。比我们的实现复杂 100 倍，但核心思想一致。

## 1.6 HTMLElement 子类

打开 `packages/dom/src/HTMLElements.ts`，你会看到 25+ 个元素类：

```typescript
export class HTMLDivElement extends Element { constructor() { super('div'); } }
export class HTMLSpanElement extends Element { constructor() { super('span'); } }
export class HTMLParagraphElement extends Element { constructor() { super('p'); } }
// ...
```

Chrome 中每个 HTML 标签都有一个 C++ 类，如 `HTMLDivElement`、`HTMLInputElement`。每个类可以有自己的特殊行为（比如 `<img>` 有 `width`、`height` 属性，`<a>` 有 `href`）。

我们的简化版本中，大多数元素只是改了 `tagName`，只有少数有特殊行为：

```typescript
// <script> 有 src 属性
export class HTMLScriptElement extends Element {
  get src(): string { return this.getAttribute('src') || ''; }
}

// <img> 有 src 和 alt
export class HTMLImageElement extends Element {
  get src(): string { return this.getAttribute('src') || ''; }
  get alt(): string { return this.getAttribute('alt') || ''; }
}
```

## 1.7 querySelector 的朴素实现

看 `packages/dom/src/Element.ts` 中的 `_matchesSimpleSelector`：

```typescript
private _matchesSimpleSelector(element: IElement, selector: string): boolean {
  if (selector.startsWith('#')) {
    return element.id === selector.substring(1);  // #id
  }
  if (selector.startsWith('.')) {
    return element.classList.contains(selector.substring(1)); // .class
  }
  // [attr=value]
  if (selector.startsWith('[') && selector.endsWith(']')) { ... }
  // 默认：标签名
  return element.tagName === selector.toUpperCase();
}
```

这是一个极简的版本。Chrome 的真实实现（`SelectorChecker`）有几千行，使用 Bloom filter 和从右向左的匹配策略来优化性能。我们会在第 4 章看到完整的选择器引擎。

## 练习题

1. 用代码构建一棵深度为 3 的 DOM 树，打印 `textContent` 验证
2. 写出 `removeChild` 的伪代码（不要看源码）
3. 思考：为什么 `Document` 本身不出现在 HTML 里，但它是 DOM 树的根？

> 下一章：[HTML 解析器](./02-html-parser.md) — 把 HTML 字符串变成 DOM 树
