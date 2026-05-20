# 最小可用浏览器 — 学习浏览器原理

仿照 Chrome 的真实架构，从零构建一个最小但功能正确的浏览器，用于深入学习浏览器工作原理。

## 项目目标

作为前端工程师，每天使用浏览器但很少了解其内部机制。本项目的目标是通过亲手实现一个最小可用的浏览器，深入理解浏览器的核心原理。每个模块都对应 Chrome/Blink 中的真实模块。

## 核心设计

复刻 Chrome 的关键架构原则：

1. **多进程架构** — 浏览器进程 + 渲染进程，通过 `child_process.fork()` 实现进程隔离
2. **渲染流水线** — HTML → DOM → CSSOM → Render Tree → Layout → Display
3. **HTML5 规范解析** — 词法分析器 + 树构造器（含插入模式状态机）
4. **CSS 层叠** — 来源优先级、选择器特异性、属性继承、计算值
5. **盒模型布局** — 块级/行内格式化上下文、外边距合并

## 技术选型

- **语言**：TypeScript（Node.js）
- **输出**：基于文本的布局查看器（展示每个盒子的位置和尺寸）

## 项目结构

```
浏览器原理/
├── packages/
│   ├── shared/              # 共享类型定义（DOM/CSS/布局/IPC）
│   ├── dom/                 # DOM 树实现（Node/Element/Document/Text）
│   ├── html-parser/         # HTML 解析器（词法分析 + 树构造）
│   ├── css-parser/          # CSS 解析器（词法分析 + 规则解析 + 选择器解析）
│   ├── style/               # 样式解析（层叠/特异性/继承/计算样式）
│   ├── layout/              # 布局引擎（块布局/行内布局/盒模型）
│   ├── network/             # 网络模块（HTTP 客户端 + 缓存）
│   ├── js-engine/           # JS 引擎（vm 沙箱 + DOM 绑定）
│   ├── renderer-process/    # 渲染进程（流水线编排）
│   ├── browser-process/     # 浏览器进程（进程管理 + IPC）
│   └── output/              # 输出模块（布局树可视化）
├── examples/                # 测试用 HTML 页面
└── tests/
    ├── unit/                # 各模块单元测试
    └── integration/         # 集成测试
```

## 实现阶段

| 阶段 | 内容 | Chrome 对应模块 |
|---|---|---|
| 0 | 项目脚手架 | — |
| 1 | DOM 实现 | `blink/renderer/core/dom/` |
| 2 | HTML 解析器 | `blink/renderer/core/html/parser/` |
| 3 | CSS 解析器 | `blink/renderer/core/css/parser/` |
| 4 | 样式解析 | `blink/renderer/core/css/resolver/` |
| 5 | 布局引擎 | `blink/renderer/core/layout/` |
| 6 | 网络模块 | `services/network/` |
| 7 | 渲染流水线 | Blink `DocumentLoader` / `Frame` |
| 8 | 多进程架构 | `content/browser/` + `content/renderer/` |
| 9 | JS 集成 | Blink V8 绑定层 |
| 10 | 输出展示 | Blink paint + compositor |

## 数据流全景

一次完整导航的流程（输入 URL → 输出布局）：

```
=== 浏览器进程 ===
1. 用户输入 URL
2. NavigationManager 解析 URL
3. RenderProcessHost 创建渲染子进程
4. 发送 IPC：{ type: "LoadHTML", html: "...", baseUrl: "..." }

=== 渲染进程 ===
5. Pipeline.navigate() 启动
6. [HTML 解析] HTMLParser.parse(html) → Document
7. [子资源加载] 解析中遇到 <link>/<script> → 请求并解析 CSS/JS
8. [样式计算] StyleResolver.resolve() → 每个元素挂载 ComputedStyle
9. [构建渲染树] 跳过非可视节点，构建 LayoutBox 树
10. [布局] 递归计算每个盒子的 x, y, width, height
11. [回传结果] IPC 发送布局树

=== 浏览器进程 ===
12. 接收布局结果
13. LayoutViewer 展示盒树
```

## 关键设计决策

| 决策项 | 选择 | 理由 |
|---|---|---|
| 进程隔离 | `child_process.fork()` | 真实内存隔离，匹配 Chrome 进程模型 |
| DOM 树结构 | 链表（firstChild/sibling） | 精确匹配 Blink 内部实现 |
| 输出方式 | 文本布局查看器 | 学习重点是布局计算而非图形渲染 |
| JS 沙箱 | Node `vm` 模块 | 隔离执行，无需真实浏览器环境 |

## 运行

```bash
# 解析 HTML 文件并显示布局结果
npm run browser -- --url examples/basic-html/index.html

# 运行所有测试
npm test
```
