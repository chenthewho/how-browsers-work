# 学习导读：从入门到精通浏览器原理

> 基于 `how-browsers-work` 源码，循序渐进理解浏览器渲染引擎。

---

## 这个教程适合谁？

- 有 1 年以上前端经验，想深入理解浏览器底层
- 对"HTML 怎么变成像素"好奇
- 想看懂 Chrome/Blink 源码但不知道从哪开始
- 面试被问到"浏览器渲染原理"时只能背八股文

## 学习路线图

```
第 1 章  DOM 树：浏览器的骨架             ← 入门
第 2 章  HTML 解析器：词法分析 + 树构造    ← 核心
第 3 章  CSS 解析器：选择器与属性值        ← 核心
第 4 章  样式计算：层叠、特异性、继承      ← 核心
第 5 章  布局引擎：盒模型 + 格式化上下文   ← 精髓
第 6 章  渲染流水线：串起全部模块          ← 串联
第 7 章  多进程架构：Chrome 的安全模型     ← 进阶
第 8 章  JavaScript 集成：沙箱与 DOM API   ← 进阶
```

## 怎么学效果最好？

**不要只看，要动手。** 每个章节末尾都有练习题，建议：

1. 先跑一遍对应模块的验证脚本
2. 阅读本章文档，理解原理
3. 打开源码对照文档中的行号引用
4. 完成章节末尾的练习
5. 尝试修改代码看效果

## 快速开始

```bash
git clone git@github.com:chenthewho/how-browsers-work.git
cd how-browsers-work
npm install

# 跑一遍完整流水线，感受输出
npx ts-node packages/browser-process/src/BrowserMain.ts \
  --url examples/basic-html/index.html
```

## 预备知识

- TypeScript 基础（interface、class、泛型）
- Node.js 基础（fs、child_process、vm）
- CSS 盒模型、选择器、层叠优先级
- 基本的编译原理概念（词法分析、语法分析）

## 阅读源码的 tips

每个模块的文件命名都有规律：
- `src/Xxx.ts` → 核心实现
- `src/index.ts` → 对外导出
- `tests/verify.ts` → 验证脚本

代码注释遵循统一格式：
- `/** */` → 模块/类/方法的文档注释
- `// ---` → 段落分隔
- `// 对应 Chrome xxx` → Chrome 源码对照
