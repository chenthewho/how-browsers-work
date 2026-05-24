# 第 6 章：渲染流水线 — 串起全部模块

## 本章目标

把前 5 章的知识串起来，理解一次完整的"输入 HTML/CSS → 输出布局树"全流程。

## 6.1 五大阶段回顾

```
  ╔════════════════════════════════════════════════════════╗
  ║           浏览器渲染流水线全景图                         ║
  ╠════════════════════════════════════════════════════════╣
  ║                                                        ║
  ║  输入                   处理                     输出    ║
  ║ ─────────────────────────────────────────────────────  ║
  ║                                                        ║
  ║  HTML 字符串 ──→ [HTML Parser] ──→ DOM Tree            ║
  ║                     25 状态      (链表树结构)            ║
  ║                     Tokenizer                          ║
  ║                        +                              ║
  ║                     TreeBuilder                        ║
  ║                                                        ║
  ║  CSS 字符串  ──→ [CSS Parser]  ──→ StyleSheet          ║
  ║                     18 种 token   (规则+选择器+声明)      ║
  ║                                                        ║
  ║              DOM + CSS                                 ║
  ║                 │                                      ║
  ║                 ▼                                      ║
  ║         [Style Resolver] ──→ ComputedStyle             ║
  ║         层叠→特异性→继承      (50 个属性，全部绝对值)     ║
  ║                 │                                      ║
  ║                 ▼                                      ║
  ║         [Layout Engine]  ──→ LayoutBox Tree            ║
  ║         BFC/IFC/盒模型        (每个盒子的 x,y,w,h)       ║
  ║                 │                                      ║
  ║                 ▼                                      ║
  ║         [Layout Viewer] ──→ 屏幕/文本输出               ║
  ║                                                        ║
  ╚════════════════════════════════════════════════════════╝
```

## 6.2 流水线编排器

`packages/renderer-process/src/Pipeline.ts` 是总指挥：

```typescript
export class RenderPipeline {
  render(html: string, cssList: string[] = []): PipelineResult {
    // 1. HTML → DOM
    const document = this.htmlParser.parse(html);

    // 2. CSS → StyleSheets
    const authorStylesheets = cssList.map(css =>
      this.cssParser.parse(css, StyleOrigin.AUTHOR)
    );

    // 3. DOM + CSS → ComputedStyle
    this.styleResolver.resolve(document, authorStylesheets);

    // 4. ComputedStyle → LayoutBox Tree
    const layoutRoot = this.layoutEngine.layout(document.documentElement!);

    return { document, layoutRoot };
  }
}
```

整个流程：**顺序同步的**。在实际 Chrome 中，HTML 解析器是**渐进式**的一遇到 `<script>` 会暂停解析去下载执行 JS，CSS 解析和 HTML 解析可以并行，但布局必须等样式计算完成。

## 6.3 数据转换全貌

```
输入：
<!DOCTYPE html>
<html>
<body>
  <div id="main" class="container" style="padding: 20px">
    <h1>Hello World</h1>
  </div>
</body>
</html>

CSS:
#main { margin: 30px auto; width: 600px }
h1 { color: #333; font-size: 24px }

输出：LayoutBox Tree
[block] <html>       pos:(0,0)    800×?
  [block] <body>     pos:(8,8)    784×?
    m:(8,8,8,8)  ← UA 默认 margin
    [block] <div#main.container>
      pos:(30,30)   600×?
      m:(30,30,30,30)  ← CSS #main { margin:30px }
      p:(20,20,20,20)  ← 内联 style="padding:20px"
      [block] <h1>
        pos:(61,61)  536×?
        m:(21.44, ...)  ← UA h1 默认 margin (0.67em ≈ 21.44px)
        [inline] TEXT "Hello World"
          pos:(0,0)   202×20
```

## 6.4 代码路径追踪

以 `examples/basic-html/index.html` 为例，完整调用链：

```
BrowserMain.ts:main()
  │
  ├─ fs.readFileSync(examples/basic-html/index.html)
  │
  ├─ new RenderPipeline(800, 600)
  │   ├─ HTMLParser.parse(html)
  │   │   ├─ Tokenizer.tokenize()        // 状态机: DATA → TAG_OPEN → TAG_NAME → ...
  │   │   └─ TreeBuilder.build(tokens)   // 状态机: INITIAL → BEFORE_HTML → IN_BODY → ...
  │   │
  │   ├─ CSSParser.parse(css, AUTHOR)
  │   │   ├─ CSSTokenizer.tokenize()     // 产生 #id .class { } : ; token
  │   │   ├─ CSSParser.parseRule()
  │   │   └─ SelectorParser.parse()      // 结构化选择器
  │   │
  │   ├─ StyleResolver.resolve(doc, [css])
  │   │   ├─ 遍历每个 DOM 元素
  │   │   ├─ matchesSelector()           // 从右向左匹配
  │   │   ├─ cascadeCompare()            // 层叠排序
  │   │   └─ applyDeclaration()          // 应用属性值
  │   │
  │   └─ LayoutEngine.layout(doc.documentElement)
  │       ├─ buildLayoutTree()           // DOM → LayoutBox 树
  │       ├─ layoutBlock()               // BFC: 垂直堆叠
  │       └─ layoutInline()              // IFC: 水平流式
  │
  └─ LayoutViewer.render(layoutRoot)      // 文本输出
```

## 6.5 浏览器进程入口

`packages/browser-process/src/BrowserMain.ts` 是 CLI 入口，做的事：

1. 解析命令行参数（`--url`、`--width`、`--height`）
2. 如果是本地文件：`fs.readFileSync` 读取 HTML + 同目录 `style.css`
3. 如果是远程 URL：`HttpClient.fetch()` 获取
4. 创建 `RenderPipeline`，执行 `render()`
5. `LayoutViewer.render()` 输出到终端

```bash
# 运行
npx ts-node packages/browser-process/src/BrowserMain.ts \
  --url examples/basic-html/index.html
```

## 6.6 单进程 vs 多进程

有两种运行模式：

**单进程模式**（`BrowserMain.ts`）：所有代码在一个进程。简单、适合调试。

**多进程模式**（`MultiProcessBrowser.ts`）：
```
Browser Process              Renderer Process
    │                             │
    ├─ fork() ───────────────────→│
    │                             ├─ 接收 LoadHTML 消息
    ├─ send(LoadHTML) ──────────→│
    │                             ├─ 执行 RenderPipeline
    │                             ├─ send(LayoutComplete) ──→
    │←── 接收布局结果 ─────────────┤
    │                             │
    ├─ kill() ───────────────────→ x
```

多进程模式对应 Chrome 的 `content/browser/` + `content/renderer/` 架构。

## 6.7 输出：LayoutViewer

`packages/output/src/LayoutViewer.ts` 将布局树渲染为人类可读的文本：

```typescript
render(root: LayoutBox): string {
  // 对每个盒子输出：
  // [block] <div#main.container>
  //   pos:(30,30) size:600×172
  //   m:(30,30,30,30) b:(0,0,0,0) p:(20,20,20,20)
  //   对每个子盒子递归...
}
```

## 练习题

1. 跟踪一个 `<p>` 元素的完整渲染路径：从 HTML 字符串到 LayoutBox，经过了哪些函数？
2. 修改 `BrowserMain.ts` 支持 `--css` 参数，允许从命令行指定额外的 CSS
3. 让 `LayoutViewer` 以 JSON 格式而非文本格式输出布局树

> 下一章：[多进程架构](./07-multi-process.md) — 为什么 Chrome 一个 Tab 一个进程？
