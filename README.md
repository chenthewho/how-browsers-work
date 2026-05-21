# Learning Browser

> 仿 Chrome 架构，从零构建的最小可用浏览器。用于深入学习浏览器工作原理。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-20+-green)](https://nodejs.org/)

---

## 🎨 交互式可视化

在浏览器中实时查看渲染流水线每一步的中间结果：

1. 打开 `packages/visualizer/public/index.html`
2. 输入 HTML + CSS，点击「渲染」
3. 查看 DOM 树、Token 流、布局画布、CSS 层叠、盒模型图

或在终端构建后打开：

```bash
cd packages/visualizer && node build.mjs && open public/index.html
```

---

## 为什么会有这个项目

作为前端工程师，每天使用浏览器但很少了解其内部机制。这个项目通过**亲手实现**一个最小但功能正确的浏览器，来深入理解：

- HTML 是如何被解析成 DOM 树的
- CSS 选择器是如何匹配的，层叠优先级是如何计算的
- 浏览器如何将 DOM + CSS 计算为屏幕上每个像素的位置和尺寸
- Chrome 的多进程架构是如何隔离渲染任务的
- JavaScript 是如何在沙箱中操作 DOM 的

每个模块都直接对应 Chrome/Blink 源码中的真实模块。

---

## 架构概览

```
┌──────────────────────────────────────────────────────┐
│               Browser Process（浏览器主进程）           │
│                                                      │
│  BrowserMain ──→ RenderProcessHost ──→ IPC ─────────┐│
│  HttpClient（网络请求）    LayoutViewer（布局输出）      ││
└──────────────────────────────────────────────────────┘│
                                                         │
  ┌─ child_process.fork() ──────────────────────────────┘
  │
┌─▼────────────────────────────────────────────────────┐
│              Renderer Process（渲染进程）               │
│                                                      │
│  RenderPipeline（流水线编排）                           │
│                                                      │
│  HTML ──→ [HTML Parser] ──→ DOM Tree                 │
│             25 状态词法分析器 + 9 插入模式树构造器         │
│                                                      │
│  CSS  ──→ [CSS Parser]  ──→ StyleSheets              │
│             词法分析器 + 选择器解析器                     │
│                                                      │
│  DOM + CSS ──→ [Style Resolver] ──→ ComputedStyle    │
│                 层叠 / 特异性 / 继承                    │
│                                                      │
│  ComputedStyle ──→ [Layout Engine] ──→ LayoutBox Tree│
│                    块布局 / 行内布局 / 外边距合并         │
│                                                      │
│  JS ──→ [ScriptRunner] ──→ DOM Mutations             │
│          vm.createContext() 沙箱 + DOM Bindings       │
└──────────────────────────────────────────────────────┘
```

---

## 快速开始

```bash
# 安装依赖
npm install

# 运行浏览器（解析 HTML 并输出布局树）
npx ts-node packages/browser-process/src/BrowserMain.ts --url examples/basic-html/index.html
```

### 示例输出

```
╔══════════════════════════════════════════╗
║   Learning Browser v1.0                  ║
╚══════════════════════════════════════════╝

Loading: examples/basic-html/index.html
  CSS: examples/basic-html/style.css

--- Rendering ---

[block] <html>
  pos:(0, 0) size:800 × 288
  m:(0,0,0,0) b:(0,0,0,0) p:(0,0,0,0)
  [block] <body>
    pos:(8, 8) size:784 × 272                        ← UA 默认 margin: 8px
    [block] <div#main.container>
      pos:(30, 30) size:600 × 172                     ← #main { margin:30px; width:600px; padding:20px }
      m:(30,30,30,30) b:(0,0,0,0) p:(20,20,20,20)
      [block] <h1>
        pos:(41, 41) size:557 × 0
        [inline] TEXT "Welcome to Learning Browser!"  ← 文本行内流式排列
          pos:(0, 0) size:382 × 20
      [block] <p>
        [inline] TEXT "This is a minimal browser..."
        [inline] <strong>                              ← 行内元素嵌套
          [inline] TEXT "learning"
            pos:(0, 0) size:77 × 2
      [block] <ul>                                    ← 列表垂直堆叠
        [block] <li>                                  ← 外边距合并
          [inline] TEXT "HTML5 Parser"
        [block] <li>
          [inline] TEXT "CSS Parser & Style Resolution"
        ...
```

输出中每个盒子标注了 `pos`（位置）、`size`（尺寸）、`m/b/p`（margin/border/padding）。

---

## 项目结构

```
learning-browser/
├── packages/
│   ├── shared/              # 共享类型（DOM / CSS / 布局 / IPC）
│   ├── dom/                 # DOM 树（Node / Element / Document / Text）
│   ├── html-parser/         # HTML 解析器（Tokenizer + TreeBuilder）
│   ├── css-parser/          # CSS 解析器（Tokenizer + Parser + SelectorParser）
│   ├── style/               # 样式解析（层叠 / 特异性 / 继承 / 计算样式）
│   ├── layout/              # 布局引擎（块布局 / 行内布局 / 盒模型）
│   ├── network/             # 网络模块（HTTP 客户端）
│   ├── js-engine/           # JS 引擎（vm 沙箱 + DOM 绑定）
│   ├── renderer-process/    # 渲染进程（Pipeline 编排）
│   ├── browser-process/     # 浏览器进程（进程管理 + IPC）
│   └── output/              # 输出模块（布局树文本可视化）
├── examples/                # 测试用 HTML 页面
└── tests/                   # 单元 & 集成测试
```

---

## 模块与 Chrome 对应关系

| 模块 | 文件数 | 行数 | Chrome/Blink 对应 |
|---|---|---|---|
| `shared/` | 6 | 698 | 跨模块类型定义 |
| `dom/` | 10 | 1,233 | `third_party/blink/renderer/core/dom/` |
| `html-parser/` | 5 | **1,843** | `third_party/blink/renderer/core/html/parser/` |
| `css-parser/` | 4 | 1,301 | `third_party/blink/renderer/core/css/parser/` |
| `style/` | 6 | 1,105 | `third_party/blink/renderer/core/css/resolver/` |
| `layout/` | 3 | 559 | `third_party/blink/renderer/core/layout/` |
| `network/` | 2 | 83 | `services/network/` |
| `js-engine/` | 3 | 337 | `third_party/blink/renderer/bindings/` |
| `renderer-process/` | 3 | 193 | `content/renderer/` |
| `browser-process/` | 4 | 416 | `content/browser/` |
| `output/` | 2 | 82 | DevTools Elements 面板 |
| **合计** | **48** | **7,850** | |

注释占比约 29%（约 2,300 行中文注释），解释每个设计决策与 Chrome 实现的关系。

---

## 关键设计决策

| 决策 | 选择 | 理由 |
|---|---|---|
| 进程隔离 | `child_process.fork()` | 真实内存隔离，精确匹配 Chrome 进程模型 |
| DOM 树结构 | 链表（firstChild / nextSibling） | 与 Blink 的 ContainerNode 完全一致 |
| HTML 解析 | 状态机（25 状态 + 9 插入模式） | 遵循 HTML5 规范的分阶段解析算法 |
| CSS 选择器匹配 | 从右向左匹配 | 与 Chrome SelectorChecker 算法一致 |
| 输出方式 | 文本布局查看器 | 学习重点在布局计算，而非图形渲染 |
| JS 沙箱 | Node.js `vm` 模块 | 隔离执行环境，模拟浏览器安全模型 |
| 语言 | TypeScript | 前端工程师最熟悉的语言 |

---

## 渲染流水线（完整数据流）

```
输入 URL
  │
  ▼
┌──────────────────┐
│ Browser Process  │  HttpClient.fetch(url) → HTML/CSS 字节
└──────┬───────────┘
       │ IPC: LoadHTML
       ▼
┌──────────────────┐
│ Renderer Process │
│                  │
│ 1. HTML 字节     │  HTMLParser.parse()
│    ──→ Token 流  │    词法分析：~25 个状态，产生 StartTag/EndTag/Character/Comment 等 token
│    ──→ DOM 树    │    树构造：~9 个插入模式，管理开放元素栈和格式化元素列表
│                  │
│ 2. CSS 字节      │  CSSParser.parse()
│    ──→ Token 流  │    词法分析：18 种 token 类型
│    ──→ StyleSheet│    语法分析：规则列表 + 选择器 + 声明
│                  │
│ 3. DOM + CSS     │  StyleResolver.resolve()
│    ──→ 层叠排序   │    来源(UA/Author) → !important → 特异性[a,b,c] → 源码顺序
│    ──→ 继承计算   │    可继承属性从父元素继承，其余使用初始值
│    ──→ ComputedStyle│  em→px, 颜色, 简写展开
│                  │
│ 4. ComputedStyle │  LayoutEngine.layout()
│    ──→ RenderTree│    跳过 display:none 和非可视节点
│    ──→ LayoutBox │    块布局(BFC): 垂直堆叠 + 宽度计算 + 外边距合并
│                  │    行内布局(IFC): 水平流式 + 换行 + 基线对齐
│                  │
│ 5. [可选] JS 执行│  ScriptRunner.execute()
│    ──→ DOM 变更   │    vm.createContext() 隔离沙箱
│    ──→ 重新布局   │    DOM 变更后自动重新计算样式和布局
│                  │
│ 6. 布局结果       │  IPC: LayoutComplete → Browser Process
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Browser Process  │  LayoutViewer.render()
│                  │  文本格式展示每个盒子的位置、尺寸、盒模型
└──────────────────┘
```

---

## 运行模式

### 单进程模式（默认）

所有渲染工作在浏览器进程中完成，适用于学习和调试。

```bash
npx ts-node packages/browser-process/src/BrowserMain.ts \
  --url examples/basic-html/index.html \
  --width 1024 --height 768
```

### 多进程模式

渲染工作运行在独立的子进程中，真实模拟 Chrome 的进程隔离。

```bash
npx ts-node packages/browser-process/src/MultiProcessBrowser.ts \
  --url examples/basic-html/index.html
```

### JavaScript 集成

```typescript
import { ScriptRunner } from '@browser/js-engine';

const runner = new ScriptRunner(document);
runner.execute(`
  var el = document.getElementById('main');
  el.textContent = 'Modified by JS!';
  el.style.color = 'red';
`);
// 重新计算样式和布局
```

---

## 学习指南

如果你是这个项目的新手，请从 [docs/README.md](./docs/README.md) 开始，按章节顺序学习：

| 章节 | 内容 | 难度 |
|---|---|---|
| [第 1 章](./docs/01-dom.md) | DOM 树：浏览器的骨架 | 入门 |
| [第 2 章](./docs/02-html-parser.md) | HTML 解析器：词法分析 + 树构造 | 核心 |
| [第 3 章](./docs/03-css-parser.md) | CSS 解析器：选择器与属性值 | 核心 |
| [第 4 章](./docs/04-style-resolution.md) | 样式计算：层叠、特异性、继承 | 核心 |
| [第 5 章](./docs/05-layout-engine.md) | 布局引擎：盒模型 + 格式化上下文 | 精髓 |
| [第 6 章](./docs/06-render-pipeline.md) | 渲染流水线：串起全部模块 | 串联 |
| [第 7 章](./docs/07-multi-process.md) | 多进程架构：Chrome 的安全模型 | 进阶 |
| [第 8 章](./docs/08-js-integration.md) | JavaScript 集成：沙箱与 DOM API | 进阶 |

每章包含：原理解析、源码追踪、代码片段、图解、练习题。

## License

MIT © 2026 thewho
