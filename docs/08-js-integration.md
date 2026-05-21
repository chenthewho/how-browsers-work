# 第 8 章：JavaScript 集成 — 沙箱与 DOM API

## 本章目标

理解浏览器如何让 JavaScript 在安全的沙箱中操作 DOM，以及为什么 `document.getElementById` 能工作。

## 8.1 JS 运行在哪里？

在 Chrome 中，每个渲染进程有一个 V8 Isolate（JS 引擎实例）。JS 代码不能直接访问 C++ DOM 对象，而是通过**绑定层**（Bindings）来交互。

```
JavaScript Code
    │
    │ document.getElementById('main')
    ▼
┌──────────────┐
│ DOM Bindings  │  把 JS 调用翻译成 C++ DOM 操作
│ (V8 ↔ Blink)  │  这里做参数校验、类型转换
└──────┬───────┘
       │
       ▼
    Blink C++ DOM
```

## 8.2 我们的沙箱：vm.createContext

`packages/js-engine/src/ScriptRunner.ts`

```typescript
export class ScriptRunner {
  private context: vm.Context;

  constructor(document: IDocument) {
    // 创建隔离的 V8 上下文
    // 这里面的代码无法访问 Node.js API：require, process, fs
    this.context = vm.createContext();
    this.setupBindings(document);
  }

  execute(script: string): any {
    return vm.runInContext(script, this.context, {
      timeout: 5000,  // 防止死循环
    });
  }
}
```

`vm.createContext()` 创建一个全新的全局作用域。里面的代码看不到 `require`、`process`、`fs`——就像浏览器里的脚本看不到文件系统一样。

## 8.3 DOM 绑定：从 JS 到 DOM 的桥梁

`packages/js-engine/src/DOMBindings.ts`

```typescript
function createElementBindings(element: IElement): object {
  return {
    // 属性
    get tagName() { return element.tagName; },
    get id() { return element.id; },
    set id(v) { element.setAttribute('id', v); },

    // 操作
    getAttribute(name) { return element.getAttribute(name); },
    setAttribute(name, value) { element.setAttribute(name, value); },

    // 查询
    querySelector(selector) {
      const el = element.querySelector(selector);
      return el ? createElementBindings(el) : null;
    },

    // 内容
    get textContent() { return element.textContent; },
    set textContent(v) { ... },

    // DOM 操作
    appendChild(child) { element.appendChild(child._rawNode); },
    removeChild(child) { element.removeChild(child._rawNode); },

    // 样式
    get style() {
      return {
        get color() { return element.style.getPropertyValue('color'); },
        set color(v) { element.style.setProperty('color', v); },
        // ...
      };
    },
  };
}
```

关键设计：**每个 JS 对象都是 C++ DOM 对象的代理**。当你写 `el.textContent = 'Hello'`，它实际调用的是 `element.removeChild(...)` + `document.createTextNode(...)`。

## 8.4 注入全局对象

```typescript
private setupBindings(document: IDocument): void {
  // 将 DOM 绑定对象传入沙箱上下文
  (this.context as any).docObj = createDOMBindings(document);

  vm.runInContext(`
    // console API
    globalThis.console = {
      log: function(...args) {
        const msg = args.map(String).join(' ');
        _print('log', msg);  // 调用外部注入的 _print 函数
      }
    };

    // document 对象——JS 脚本的入口
    globalThis.document = docObj;
  `, this.context);
}
```

注入后，JS 代码可以直接访问 `document` 和 `console`：

```javascript
// 这段代码运行在 vm.createContext 的沙箱中
var main = document.getElementById('main');
main.style.color = 'red';
console.log('color changed!');
```

## 8.5 JS 执行如何触发重新渲染？

当 JS 修改了 DOM（例如改了一个元素的 `textContent`），浏览器需要：

1. 标记受影响的节点为"脏"
2. 重新计算样式（可能影响后代元素）
3. 重新布局（可能影响兄弟元素位置）
4. 重新绘制

在我们的实现中，JS 执行后需要**手动**触发重新渲染：

```typescript
// packages/js-engine/tests/verify.ts
const runner = new ScriptRunner(doc);
runner.execute(`
  var para = document.getElementById('para');
  para.textContent = 'Modified by JavaScript!';
  para.style.color = 'blue';
`);

// 重新计算样式和布局
new StyleResolver(ua).resolve(doc, [author]);
const layoutRoot = new LayoutEngine(800, 600).layout(doc.documentElement!);
```

Chrome 中是自动的：DOM 变更会触发 `LayoutTreeRebuilder`，在下一帧自动重排。

## 8.6 运行验证

```bash
npx ts-node -P packages/js-engine/tsconfig.json packages/js-engine/tests/verify.ts
```

输出：

```
[JS] Main element found: DIV
[JS] H1 text: Hello World
[JS] Para modified: Modified by JavaScript!
[JS] Para color: blue
[JS] New div added, id: dynamic

修改后的布局树:
[block] <div#dynamic>
  [inline] TEXT "Dynamically created"    ← JS 创建的新元素
```

你可以看到：
1. `console.log` 正确输出
2. `textContent` 修改生效
3. `style.color` 修改生效
4. `createElement` + `appendChild` 成功插入新元素
5. 布局树反映了所有 JS 修改

## 8.7 安全模型：为什么需要沙箱

如果 JS 能直接访问 Node.js API：

```javascript
// 如果没有沙箱，恶意脚本可以：
require('fs').readFileSync('/etc/passwd');  // 读取系统文件
process.exit();                              // 关掉浏览器
require('child_process').exec('rm -rf /');   // 执行系统命令
```

`vm.createContext()` 阻止了这一切——沙箱中的代码只能访问我们显式注入的 API（`document`、`console`），看不到 `require` 和 `process`。

Chrome 的沙箱更进一步：渲染进程在 OS 层面被限制，即使 V8 被攻破，攻击者也很难突破沙箱访问系统。

## 8.8 Chrome 的 V8 绑定是如何工作的

Chrome 的绑定系统比我们复杂两个数量级。它使用 **Code Generation**：

1. 用 IDL（Interface Definition Language）定义每个 DOM API
2. 构建工具自动生成 C++ 绑定代码
3. 生成的代码处理：类型转换、参数校验、异常处理、内存管理

例如，`document.getElementById` 的 IDL 定义（简化）：

```webidl
interface Document {
  Element? getElementById(DOMString elementId);
};
```

构建系统生成 ~200 行 C++ 胶水代码，处理从 V8 的 `v8::String` 到 Blink 的 `AtomicString` 的转换等。

## 练习题

1. 写一段 JS 脚本，创建一个包含 5 个 `<li>` 的 `<ul>` 并插入到 body
2. 给 DOMBindings 添加 `element.classList.add()` / `element.classList.remove()` 支持
3. 思考：如果 JS 修改了 DOM 但不重新布局，下一次 `document.body.offsetHeight` 会返回旧值还是新值？为什么？

> 🎉 恭喜完成全部 8 章！返回 [总导读](./README.md)
