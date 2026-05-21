"use strict";
var Browser = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // bundle.ts
  var bundle_exports = {};
  __export(bundle_exports, {
    CSSParser: () => CSSParser,
    CSSTokenType: () => CSSTokenType,
    HTMLParser: () => HTMLParser,
    HTMLTokenizer: () => HTMLTokenizer,
    LayoutEngine: () => LayoutEngine,
    LayoutViewer: () => LayoutViewer,
    NodeType: () => NodeType,
    RenderPipeline: () => RenderPipeline,
    SelectorParser: () => SelectorParser,
    StyleOrigin: () => StyleOrigin,
    StyleResolver: () => StyleResolver,
    TokenType: () => TokenType,
    USER_AGENT_CSS: () => USER_AGENT_CSS,
    buildLayoutTree: () => buildLayoutTree,
    calculateSpecificity: () => calculateSpecificity,
    matchesSelector: () => matchesSelector
  });

  // ../shared/src/types/dom.ts
  var NodeType = /* @__PURE__ */ ((NodeType3) => {
    NodeType3[NodeType3["ELEMENT_NODE"] = 1] = "ELEMENT_NODE";
    NodeType3[NodeType3["TEXT_NODE"] = 3] = "TEXT_NODE";
    NodeType3[NodeType3["COMMENT_NODE"] = 8] = "COMMENT_NODE";
    NodeType3[NodeType3["DOCUMENT_NODE"] = 9] = "DOCUMENT_NODE";
    NodeType3[NodeType3["DOCUMENT_FRAGMENT_NODE"] = 11] = "DOCUMENT_FRAGMENT_NODE";
    return NodeType3;
  })(NodeType || {});

  // ../shared/src/types/css.ts
  var StyleOrigin = /* @__PURE__ */ ((StyleOrigin2) => {
    StyleOrigin2["USER_AGENT"] = "user-agent";
    StyleOrigin2["AUTHOR"] = "author";
    StyleOrigin2["USER"] = "user";
    return StyleOrigin2;
  })(StyleOrigin || {});

  // ../dom/src/Node.ts
  var Node = class {
    nodeValue = null;
    // ============================================================
    // 树结构指针 —— Blink 式链表
    // 所有节点通过这些指针组织成一棵树
    // ============================================================
    parentNode = null;
    firstChild = null;
    lastChild = null;
    previousSibling = null;
    nextSibling = null;
    // ============================================================
    // 所属文档 — 每个节点都属于某个 Document
    // 对应 Blink 的 Node::ownerDocument_
    // ============================================================
    ownerDocument = null;
    // ============================================================
    // 子节点操作
    // ============================================================
    /**
     * 在末尾追加子节点。
     * 如果 child 已经有父节点，会先从旧父节点移除（这是 DOM 规范的行为）。
     *
     * 时间复杂度：O(1) — 因为维护了 lastChild 指针
     */
    appendChild(child) {
      if (child.parentNode) {
        child.parentNode.removeChild(child);
      }
      child.parentNode = this;
      if (this.lastChild) {
        child.previousSibling = this.lastChild;
        this.lastChild.nextSibling = child;
        this.lastChild = child;
      } else {
        this.firstChild = child;
        this.lastChild = child;
      }
      return child;
    }
    /**
     * 在 referenceNode 之前插入子节点。
     * 如果 referenceNode 为 null，则插入到末尾（同 appendChild）。
     *
     * Chrome 中这个方法用于实现 DOM 的 insertBefore
     */
    insertBefore(newNode, referenceNode) {
      if (referenceNode && referenceNode.parentNode !== this) {
        throw new Error("insertBefore: referenceNode is not a child of this node");
      }
      if (!referenceNode) {
        return this.appendChild(newNode);
      }
      if (newNode.parentNode) {
        newNode.parentNode.removeChild(newNode);
      }
      newNode.parentNode = this;
      newNode.nextSibling = referenceNode;
      newNode.previousSibling = referenceNode.previousSibling;
      if (referenceNode.previousSibling) {
        referenceNode.previousSibling.nextSibling = newNode;
      } else {
        this.firstChild = newNode;
      }
      referenceNode.previousSibling = newNode;
      return newNode;
    }
    /**
     * 移除指定子节点。
     *
     * 时间复杂度：O(1) — 通过 sibling 指针重新链接
     */
    removeChild(child) {
      if (child.parentNode !== this) {
        throw new Error("removeChild: child is not a child of this node");
      }
      if (child.previousSibling) {
        child.previousSibling.nextSibling = child.nextSibling;
      } else {
        this.firstChild = child.nextSibling;
      }
      if (child.nextSibling) {
        child.nextSibling.previousSibling = child.previousSibling;
      } else {
        this.lastChild = child.previousSibling;
      }
      child.parentNode = null;
      child.previousSibling = null;
      child.nextSibling = null;
      return child;
    }
    /**
     * 用新节点替换旧节点
     */
    replaceChild(newNode, oldNode) {
      this.insertBefore(newNode, oldNode);
      this.removeChild(oldNode);
      return oldNode;
    }
    // ============================================================
    // 查询方法
    // ============================================================
    hasChildNodes() {
      return this.firstChild !== null;
    }
    /**
     * 判断当前节点是否包含另一个节点（可能是深层后代）
     */
    contains(other) {
      let current = other;
      while (current) {
        if (current === this) return true;
        current = current.parentNode;
      }
      return false;
    }
    /**
     * 文本内容 — 获取所有后代文本节点的内容连接
     * 对应 Node::textContent 的 getter
     */
    get textContent() {
      if (this.nodeType === 3 /* TEXT_NODE */) {
        return this.nodeValue || "";
      }
      let result = "";
      let child = this.firstChild;
      while (child) {
        result += child.textContent;
        child = child.nextSibling;
      }
      return result;
    }
    /**
     * 设置 textContent — 会删除所有子节点，替换为一个文本节点
     */
    set textContent(value) {
      while (this.firstChild) {
        this.removeChild(this.firstChild);
      }
      if (value && this.ownerDocument) {
        const textNode = this.ownerDocument.createTextNode(value);
        textNode.parentNode = this;
        this.firstChild = textNode;
        this.lastChild = textNode;
      }
    }
  };

  // ../dom/src/DOMTokenList.ts
  var DOMTokenList = class {
    // 内部用 Set 存储类名
    _tokens;
    // 关联的元素（用于回写 class 属性）
    _element;
    constructor(element, className) {
      this._element = element;
      this._tokens = new Set(
        className.split(/\s+/).filter((t) => t.length > 0)
        // 过滤空字符串
      );
    }
    get length() {
      return this._tokens.size;
    }
    item(index) {
      const arr = Array.from(this._tokens);
      return arr[index] || null;
    }
    contains(token) {
      return this._tokens.has(token);
    }
    add(...tokens) {
      for (const token of tokens) {
        this._tokens.add(token);
      }
      this._syncToElement();
    }
    remove(...tokens) {
      for (const token of tokens) {
        this._tokens.delete(token);
      }
      this._syncToElement();
    }
    toggle(token) {
      if (this._tokens.has(token)) {
        this._tokens.delete(token);
        this._syncToElement();
        return false;
      } else {
        this._tokens.add(token);
        this._syncToElement();
        return true;
      }
    }
    toString() {
      return Array.from(this._tokens).join(" ");
    }
    /**
     * 将内部状态同步回元素的 class 属性
     */
    _syncToElement() {
      this._element.className = this.toString();
    }
  };

  // ../dom/src/CSSStyleDeclaration.ts
  var CSSStyleDeclarationBase = class {
    // 内部用 Map 存储 CSS 属性值
    _properties = /* @__PURE__ */ new Map();
    _element;
    constructor(element) {
      this._element = element;
    }
    /**
     * cssText: 获取或设置完整的样式字符串
     * 例如："color: red; font-size: 16px"
     */
    get cssText() {
      const result = [];
      this._properties.forEach((value, key) => {
        result.push(`${key}: ${value}`);
      });
      return result.join("; ");
    }
    set cssText(value) {
      this._properties.clear();
      for (const part of value.split(";")) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        const colonIdx = trimmed.indexOf(":");
        if (colonIdx === -1) continue;
        const prop = trimmed.substring(0, colonIdx).trim();
        const val = trimmed.substring(colonIdx + 1).trim();
        this._properties.set(prop, val);
      }
    }
    getPropertyValue(property) {
      return this._properties.get(property) || "";
    }
    setProperty(property, value) {
      this._properties.set(property, value);
    }
    removeProperty(property) {
      const oldValue = this._properties.get(property) || "";
      this._properties.delete(property);
      return oldValue;
    }
  };
  function createCSSStyleDeclaration(element) {
    const decl = new CSSStyleDeclarationBase(element);
    return new Proxy(decl, {
      get(target, prop) {
        if (prop in target) {
          return target[prop];
        }
        const cssProp = camelToKebab(prop);
        return target.getPropertyValue(cssProp);
      },
      set(target, prop, value) {
        if (prop in target) {
          target[prop] = value;
        } else {
          const cssProp = camelToKebab(prop);
          target.setProperty(cssProp, value);
        }
        return true;
      }
    });
  }
  function camelToKebab(str) {
    return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  }

  // ../dom/src/Element.ts
  var Element = class _Element extends Node {
    nodeType = 1 /* ELEMENT_NODE */;
    tagName;
    // ============================================================
    // 属性存储 —— 对应 Blink 的 ElementData
    // 使用 Map 存储，比 Blink 的 ElementData 简单但功能相同
    // 特殊属性 id 和 class 会同时被 Map.get 和属性访问器返回
    // ============================================================
    _attributes = /* @__PURE__ */ new Map();
    // ============================================================
    // classList —— 对应 Blink 的 DOMTokenList
    // ============================================================
    _classList;
    // ============================================================
    // 内联样式 —— 对应 Blink 的 CSSStyleDeclaration
    // ============================================================
    _style;
    // ============================================================
    // 计算样式 —— 由 StyleResolver 挂载
    // ============================================================
    computedStyle = null;
    constructor(tagName) {
      super();
      this.tagName = tagName.toUpperCase();
      this._classList = new DOMTokenList(this, "");
      this._style = createCSSStyleDeclaration(this);
    }
    // ============================================================
    // nodeName — 元素的 nodeName 返回大写标签名
    // ============================================================
    get nodeName() {
      return this.tagName;
    }
    // ============================================================
    // id 属性 — 直接访问 getAttribute('id')
    // ============================================================
    get id() {
      return this.getAttribute("id") || "";
    }
    set id(value) {
      this.setAttribute("id", value);
    }
    // ============================================================
    // className — 直接访问 getAttribute('class')
    // ============================================================
    get className() {
      return this.getAttribute("class") || "";
    }
    set className(value) {
      this.setAttribute("class", value);
      this._classList = new DOMTokenList(this, value);
    }
    // ============================================================
    // classList
    // ============================================================
    get classList() {
      return this._classList;
    }
    // ============================================================
    // style — 内联样式
    // ============================================================
    get style() {
      return this._style;
    }
    // ============================================================
    // 属性操作 —— 对应 Blink 的 Element::getAttribute 等
    // ============================================================
    getAttribute(name) {
      return this._attributes.get(name.toLowerCase()) ?? null;
    }
    setAttribute(name, value) {
      this._attributes.set(name.toLowerCase(), value);
      if (name.toLowerCase() === "class") {
        this._classList = new DOMTokenList(this, value);
      }
    }
    removeAttribute(name) {
      this._attributes.delete(name.toLowerCase());
    }
    hasAttribute(name) {
      return this._attributes.has(name.toLowerCase());
    }
    // ============================================================
    // 子元素查询
    // 实现了最常用的 DOM 查询方法，用于 JavaScript 集成和选择器匹配
    // ============================================================
    /**
     * 按标签名查找子元素（深度优先遍历）
     * 对应 Blink 的 Element::getElementsByTagName
     */
    getElementsByTagName(tagName) {
      const result = [];
      const searchTag = tagName.toUpperCase();
      this._walkDescendants((node) => {
        if (node.nodeType === 1 /* ELEMENT_NODE */ && node.tagName === searchTag) {
          result.push(node);
        }
      });
      return result;
    }
    /**
     * 按类名查找子元素
     */
    getElementsByClassName(className) {
      const result = [];
      this._walkDescendants((node) => {
        if (node.nodeType === 1 /* ELEMENT_NODE */ && node.classList.contains(className)) {
          result.push(node);
        }
      });
      return result;
    }
    /**
     * querySelector — 使用简单选择器查询第一个匹配元素
     * 支持：tag, #id, .class, [attr], [attr=value], 组合选择器（空格分隔）
     */
    querySelector(selector) {
      return this._querySelectorAll(selector, true)[0] || null;
    }
    /**
     * querySelectorAll — 查询所有匹配元素
     */
    querySelectorAll(selector) {
      return this._querySelectorAll(selector, false);
    }
    // ============================================================
    // cloneNode
    // ============================================================
    cloneNode(deep) {
      const cloned = new _Element(this.tagName);
      this._attributes.forEach((value, key) => {
        cloned.setAttribute(key, value);
      });
      cloned._style.cssText = this._style.cssText;
      cloned.ownerDocument = this.ownerDocument;
      if (deep) {
        let child = this.firstChild;
        while (child) {
          cloned.appendChild(child.cloneNode(true));
          child = child.nextSibling;
        }
      }
      return cloned;
    }
    // ============================================================
    // 私有辅助方法
    // ============================================================
    /**
     * 深度优先遍历，对每个子节点执行回调
     */
    _walkDescendants(callback) {
      let child = this.firstChild;
      while (child) {
        callback(child);
        if (child.nodeType === 1 /* ELEMENT_NODE */) {
          child._walkDescendants(callback);
        }
        child = child.nextSibling;
      }
    }
    /**
     * 内部的选择器匹配实现
     *
     * 解析规则（简化版，后续会由完整的 CSS 选择器引擎替代）：
     * - 支持空格分隔的复合选择器（如 "div .class" 表示后代选择器）
     * - 支持 #id, .class, tag 的组合
     * - 支持 [attr] 和 [attr=value]
     */
    _querySelectorAll(selector, firstOnly) {
      const result = [];
      const parts = selector.trim().split(/\s+/);
      this._walkDescendants((node) => {
        if (node.nodeType !== 1 /* ELEMENT_NODE */) return;
        const element = node;
        let allMatch = true;
        let current = element;
        for (let i = parts.length - 1; i >= 0 && allMatch; i--) {
          const part = parts[i];
          let matched = false;
          while (current) {
            if (current.nodeType === 1 /* ELEMENT_NODE */) {
              if (this._matchesSimpleSelector(current, part)) {
                matched = true;
                break;
              }
            }
            current = current.parentNode;
          }
          if (!matched) {
            allMatch = false;
          }
          if (i > 0 && matched && current) {
            current = current.parentNode;
          }
        }
        if (allMatch) {
          result.push(element);
        }
      });
      return result;
    }
    /**
     * 判断元素是否匹配简单选择器（不含组合器）
     * 支持：#id, .class, tag, [attr], [attr=value]
     */
    _matchesSimpleSelector(element, selector) {
      if (selector.startsWith("#")) {
        return element.id === selector.substring(1);
      }
      if (selector.startsWith(".")) {
        return element.classList.contains(selector.substring(1));
      }
      if (selector.startsWith("[") && selector.endsWith("]")) {
        const inner = selector.substring(1, selector.length - 1);
        const eqIdx = inner.indexOf("=");
        if (eqIdx === -1) {
          return element.hasAttribute(inner);
        }
        const attr = inner.substring(0, eqIdx).trim();
        let val = inner.substring(eqIdx + 1).trim();
        if (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        return element.getAttribute(attr) === val;
      }
      return element.tagName === selector.toUpperCase();
    }
  };

  // ../dom/src/Text.ts
  var Text = class _Text extends Node {
    nodeType = 3 /* TEXT_NODE */;
    nodeName = "#text";
    constructor(data = "") {
      super();
      this.nodeValue = data;
    }
    get data() {
      return this.nodeValue || "";
    }
    set data(value) {
      this.nodeValue = value;
    }
    get length() {
      return this.data.length;
    }
    cloneNode(deep) {
      const cloned = new _Text(this.data);
      cloned.ownerDocument = this.ownerDocument;
      return cloned;
    }
  };

  // ../dom/src/Comment.ts
  var Comment = class _Comment extends Node {
    nodeType = 8 /* COMMENT_NODE */;
    nodeName = "#comment";
    constructor(data = "") {
      super();
      this.nodeValue = data;
    }
    get data() {
      return this.nodeValue || "";
    }
    set data(value) {
      this.nodeValue = value;
    }
    cloneNode(deep) {
      const cloned = new _Comment(this.data);
      cloned.ownerDocument = this.ownerDocument;
      return cloned;
    }
  };

  // ../dom/src/Document.ts
  var Document = class _Document extends Node {
    nodeType = 9 /* DOCUMENT_NODE */;
    nodeName = "#document";
    // ============================================================
    // 便利访问器 — 对应 Blink 的 Document::documentElement() 等
    // ============================================================
    /**
     * documentElement — 返回 <html> 元素
     */
    get documentElement() {
      let child = this.firstChild;
      while (child) {
        if (child.nodeType === 1 /* ELEMENT_NODE */ && child.tagName === "HTML") {
          return child;
        }
        child = child.nextSibling;
      }
      return null;
    }
    /**
     * head — 返回 <head> 元素
     */
    get head() {
      const html = this.documentElement;
      if (!html) return null;
      let child = html.firstChild;
      while (child) {
        if (child.nodeType === 1 /* ELEMENT_NODE */ && child.tagName === "HEAD") {
          return child;
        }
        child = child.nextSibling;
      }
      return null;
    }
    /**
     * body — 返回 <body> 元素
     */
    get body() {
      const html = this.documentElement;
      if (!html) return null;
      let child = html.firstChild;
      while (child) {
        if (child.nodeType === 1 /* ELEMENT_NODE */ && child.tagName === "BODY") {
          return child;
        }
        child = child.nextSibling;
      }
      return null;
    }
    // ============================================================
    // 节点工厂方法
    // 对应 Blink 的 Document::createElement / createTextNode
    // 所有创建的节点都自动设置 ownerDocument = this
    // ============================================================
    createElement(tagName) {
      const element = new Element(tagName);
      element.ownerDocument = this;
      return element;
    }
    createTextNode(data) {
      const text = new Text(data);
      text.ownerDocument = this;
      return text;
    }
    createComment(data) {
      const comment = new Comment(data);
      comment.ownerDocument = this;
      return comment;
    }
    // ============================================================
    // 查询方法
    // ============================================================
    /**
     * getElementById — 通过 id 查找元素
     *
     * 对应 Blink 的 Document::getElementById
     * Chrome 内部通过 ID 映射表实现，这里用简单的树遍历
     */
    getElementById(id) {
      return this._findById(this, id);
    }
    /**
     * 在子树中递归查找指定 id 的元素
     */
    _findById(root, id) {
      let child = root.firstChild;
      while (child) {
        if (child.nodeType === 1 /* ELEMENT_NODE */ && child.id === id) {
          return child;
        }
        const found = this._findById(child, id);
        if (found) return found;
        child = child.nextSibling;
      }
      return null;
    }
    // ============================================================
    // cloneNode — Document 本身通常不被克隆，但提供基本实现
    // ============================================================
    cloneNode(deep) {
      const cloned = new _Document();
      if (deep) {
        let child = this.firstChild;
        while (child) {
          cloned.appendChild(child.cloneNode(true));
          child = child.nextSibling;
        }
      }
      return cloned;
    }
  };

  // ../html-parser/src/Token.ts
  var TokenType = /* @__PURE__ */ ((TokenType2) => {
    TokenType2["START_TAG"] = "StartTag";
    TokenType2["END_TAG"] = "EndTag";
    TokenType2["CHARACTER"] = "Character";
    TokenType2["COMMENT"] = "Comment";
    TokenType2["DOCTYPE"] = "DOCTYPE";
    TokenType2["END_OF_FILE"] = "EndOfFile";
    return TokenType2;
  })(TokenType || {});
  function createStartTagToken(tagName, originalTagName) {
    return {
      type: "StartTag" /* START_TAG */,
      tagName: tagName.toLowerCase(),
      attributes: [],
      selfClosing: false,
      originalTagName: originalTagName || tagName
    };
  }
  function createEndTagToken(tagName) {
    return {
      type: "EndTag" /* END_TAG */,
      tagName: tagName.toLowerCase(),
      attributes: []
    };
  }
  function createCharacterToken(data = "") {
    return { type: "Character" /* CHARACTER */, data };
  }
  function createCommentToken(data = "") {
    return { type: "Comment" /* COMMENT */, data };
  }
  function createDOCTYPEToken() {
    return {
      type: "DOCTYPE" /* DOCTYPE */,
      name: null,
      publicId: null,
      systemId: null,
      forceQuirks: false
    };
  }
  function createEndOfFileToken() {
    return { type: "EndOfFile" /* END_OF_FILE */ };
  }

  // ../html-parser/src/Tokenizer.ts
  var HTMLTokenizer = class {
    // 输入和位置
    input = "";
    pos = 0;
    // 状态机当前状态
    state = "DATA" /* DATA */;
    // 当前正在构建的 token
    currentToken = null;
    currentAttr = null;
    // 构建中的字符串缓冲区
    buffer = "";
    // 回溯标记（用于重新处理字符）
    reconsume = false;
    // 嵌套 RAWTEXT/RCDATA 的处理
    // 当遇到 <style> 时，切换到 RAWTEXT 模式，直到遇到 </style>
    rawtextEndTagName = "";
    rcdataEndTagName = "";
    // Token 输出队列
    tokens = [];
    // 特殊标签列表（rawtext 和 rcdata 元素）
    static RAWTEXT_TAGS = /* @__PURE__ */ new Set(["style", "script", "xmp", "iframe", "noembed", "noframes"]);
    static RCDATA_TAGS = /* @__PURE__ */ new Set(["title", "textarea"]);
    /**
     * 执行词法分析，返回所有 token
     */
    tokenize(input) {
      this.input = input;
      this.pos = 0;
      this.state = "DATA" /* DATA */;
      this.tokens = [];
      this.buffer = "";
      this.reconsume = false;
      while (this.pos < this.input.length) {
        const ch = this.input[this.pos];
        this.processChar(ch);
        if (!this.reconsume) {
          this.pos++;
        }
        this.reconsume = false;
      }
      this.processEOF();
      return this.tokens;
    }
    /**
     * 处理单个字符（状态机入口）
     * 根据当前状态分发到对应的处理函数
     */
    processChar(ch) {
      switch (this.state) {
        case "DATA" /* DATA */:
          return this.handleData(ch);
        case "TAG_OPEN" /* TAG_OPEN */:
          return this.handleTagOpen(ch);
        case "END_TAG_OPEN" /* END_TAG_OPEN */:
          return this.handleEndTagOpen(ch);
        case "TAG_NAME" /* TAG_NAME */:
          return this.handleTagName(ch);
        case "BEFORE_ATTR_NAME" /* BEFORE_ATTR_NAME */:
          return this.handleBeforeAttrName(ch);
        case "ATTR_NAME" /* ATTR_NAME */:
          return this.handleAttrName(ch);
        case "AFTER_ATTR_NAME" /* AFTER_ATTR_NAME */:
          return this.handleAfterAttrName(ch);
        case "BEFORE_ATTR_VALUE" /* BEFORE_ATTR_VALUE */:
          return this.handleBeforeAttrValue(ch);
        case "ATTR_VALUE_DQ" /* ATTR_VALUE_DOUBLE_QUOTED */:
          return this.handleAttrValueDQ(ch);
        case "ATTR_VALUE_SQ" /* ATTR_VALUE_SINGLE_QUOTED */:
          return this.handleAttrValueSQ(ch);
        case "ATTR_VALUE_UQ" /* ATTR_VALUE_UNQUOTED */:
          return this.handleAttrValueUQ(ch);
        case "SELF_CLOSING" /* SELF_CLOSING_START_TAG */:
          return this.handleSelfClosing(ch);
        case "MARKUP_DECL_OPEN" /* MARKUP_DECL_OPEN */:
          return this.handleMarkupDecl(ch);
        case "COMMENT_START" /* COMMENT_START */:
          return this.handleCommentStart(ch);
        case "COMMENT_START_DASH" /* COMMENT_START_DASH */:
          return this.handleCommentStartDash(ch);
        case "COMMENT" /* COMMENT */:
          return this.handleComment(ch);
        case "COMMENT_END_DASH" /* COMMENT_END_DASH */:
          return this.handleCommentEndDash(ch);
        case "COMMENT_END" /* COMMENT_END */:
          return this.handleCommentEnd(ch);
        case "DOCTYPE" /* DOCTYPE */:
          return this.handleDOCTYPE(ch);
        case "BEFORE_DOCTYPE_NAME" /* BEFORE_DOCTYPE_NAME */:
          return this.handleBeforeDOCTYPEName(ch);
        case "DOCTYPE_NAME" /* DOCTYPE_NAME */:
          return this.handleDOCTYPEName(ch);
        case "AFTER_DOCTYPE_NAME" /* AFTER_DOCTYPE_NAME */:
          return this.handleAfterDOCTYPEName(ch);
        case "RAWTEXT" /* RAWTEXT */:
          return this.handleRawtext(ch);
        case "RAWTEXT_LESS_THAN" /* RAWTEXT_LESS_THAN */:
          return this.handleRawtextLT(ch);
        case "RAWTEXT_END_TAG" /* RAWTEXT_END_TAG_OPEN */:
          return this.handleRawtextEndTagOpen(ch);
        case "RAWTEXT_END_TAG_NAME" /* RAWTEXT_END_TAG_NAME */:
          return this.handleRawtextEndTagName(ch);
        case "RCDATA" /* RCDATA */:
          return this.handleRcdata(ch);
        case "RCDATA_LESS_THAN" /* RCDATA_LESS_THAN */:
          return this.handleRcdataLT(ch);
        case "RCDATA_END_TAG" /* RCDATA_END_TAG_OPEN */:
          return this.handleRcdataEndTagOpen(ch);
        case "RCDATA_END_TAG_NAME" /* RCDATA_END_TAG_NAME */:
          return this.handleRcdataEndTagName(ch);
      }
    }
    // ============================================================
    // 状态处理函数
    // ============================================================
    /**
     * DATA 状态 —— 默认状态，大多数内容在此处理
     *
     * 触发条件：进入词法分析器时的初始状态；或从其他状态返回
     *
     * 行为：
     *   - & → 字符引用处理（简化：直接输出）
     *   - < → 切换到 TAG_OPEN
     *   - 其他 → 输出字符 token（会合并连续字符）
     *
     * 注意：为了性能，连续的字符会被合并成一个 token，
     * 而不是每个字符一个 token。这与 Chrome 的做法一致。
     */
    handleData(ch) {
      if (ch === "<") {
        this.flushCharacterBuffer();
        this.state = "TAG_OPEN" /* TAG_OPEN */;
      } else if (ch === "&") {
        this.buffer += ch;
      } else {
        this.buffer += ch;
      }
    }
    /**
     * TAG_OPEN —— 刚读到 <
     *
     * 行为：
     *   - ! → 标记声明（<!-- 或 <!DOCTYPE）
     *   - / → 结束标签开始
     *   - a-z/A-Z → 开始标签，切换到 TAG_NAME
     *   - ? → 伪注释（兼容历史），跳过
     *   - 其他 → 当作普通字符，回到 DATA
     */
    handleTagOpen(ch) {
      if (ch === "!") {
        this.state = "MARKUP_DECL_OPEN" /* MARKUP_DECL_OPEN */;
      } else if (ch === "/") {
        this.state = "END_TAG_OPEN" /* END_TAG_OPEN */;
      } else if (isLetter(ch)) {
        this.currentToken = createStartTagToken(ch);
        this.state = "TAG_NAME" /* TAG_NAME */;
      } else if (ch === "?") {
        this.createCommentToken("?");
        this.state = "COMMENT" /* COMMENT */;
      } else {
        this.buffer += "<";
        this.reconsume = true;
        this.state = "DATA" /* DATA */;
      }
    }
    /**
     * END_TAG_OPEN —— 刚读到 </
     *
     * 行为：
     *   - a-z/A-Z → 结束标签，切换到 TAG_NAME
     *   - > → 错误情况，直接回到 DATA
     *   - EOF → 解析错误
     */
    handleEndTagOpen(ch) {
      if (isLetter(ch)) {
        this.currentToken = createEndTagToken(ch);
        this.state = "TAG_NAME" /* TAG_NAME */;
      } else {
        this.state = "DATA" /* DATA */;
      }
    }
    /**
     * TAG_NAME —— 正在读取标签名
     *
     * 无论是开始标签还是结束标签，都在这个状态读取标签名。
     * 标签名由字母、数字、连字符组成。
     *
     * 行为：
     *   - 空格/换行 → 标签名结束，切换到 BEFORE_ATTR_NAME
     *   - / → 自闭合标签，切换到 SELF_CLOSING
     *   - > → 标签结束，发射 token
     *   - a-z/A-Z/0-9 → 追加到标签名
     */
    handleTagName(ch) {
      if (isWhitespace(ch)) {
        this.state = "BEFORE_ATTR_NAME" /* BEFORE_ATTR_NAME */;
      } else if (ch === "/") {
        this.state = "SELF_CLOSING" /* SELF_CLOSING_START_TAG */;
      } else if (ch === ">") {
        this.emitCurrentToken();
        this.state = "DATA" /* DATA */;
      } else if (isLetter(ch) || isDigit(ch)) {
        this.currentToken.tagName += ch.toLowerCase();
      }
    }
    /**
     * BEFORE_ATTR_NAME —— 属性名之前
     *
     * 跳过空格，准备读取属性名。
     * 如果遇到 / 或 >，说明没有更多属性了。
     */
    handleBeforeAttrName(ch) {
      if (isWhitespace(ch)) {
        return;
      } else if (ch === "/" || ch === ">") {
        this.reconsume = true;
        this.state = "AFTER_ATTR_NAME" /* AFTER_ATTR_NAME */;
      } else {
        this.currentAttr = { name: "", value: "" };
        this.reconsume = true;
        this.state = "ATTR_NAME" /* ATTR_NAME */;
      }
    }
    /**
     * ATTR_NAME —— 正在读取属性名
     *
     * 属性名由字母、数字、连字符、下划线组成。
     * 遇到 = 表示接下来是属性值。
     */
    handleAttrName(ch) {
      if (isWhitespace(ch) || ch === "/" || ch === ">") {
        this.reconsume = true;
        this.state = "AFTER_ATTR_NAME" /* AFTER_ATTR_NAME */;
      } else if (ch === "=") {
        this.state = "BEFORE_ATTR_VALUE" /* BEFORE_ATTR_VALUE */;
      } else if (isLetter(ch)) {
        if (this.currentAttr) {
          this.currentAttr.name += ch.toLowerCase();
        }
      } else {
        if (this.currentAttr) {
          this.currentAttr.name += ch;
        }
      }
    }
    /**
     * AFTER_ATTR_NAME —— 属性名之后
     *
     * 完成当前属性的处理（可能有值，可能没有）。
     * 准备读取下一个属性或结束标签。
     */
    handleAfterAttrName(ch) {
      if (isWhitespace(ch)) {
        return;
      }
      if (this.currentAttr && this.currentToken && isStartTag(this.currentToken)) {
        this.currentToken.attributes.push({ ...this.currentAttr });
        this.currentAttr = null;
      }
      if (ch === "/") {
        this.state = "SELF_CLOSING" /* SELF_CLOSING_START_TAG */;
      } else if (ch === ">") {
        this.emitCurrentToken();
        this.state = "DATA" /* DATA */;
      } else if (ch === "=") {
        this.state = "BEFORE_ATTR_VALUE" /* BEFORE_ATTR_VALUE */;
      } else {
        this.currentAttr = { name: "", value: "" };
        this.reconsume = true;
        this.state = "ATTR_NAME" /* ATTR_NAME */;
      }
    }
    /**
     * BEFORE_ATTR_VALUE —— 属性值之前
     *
     * 跳过 = 和空格，准备读取属性值。
     * 属性值可以是被引号包裹的，也可以是无引号的。
     */
    handleBeforeAttrValue(ch) {
      if (isWhitespace(ch)) {
        return;
      } else if (ch === '"') {
        this.state = "ATTR_VALUE_DQ" /* ATTR_VALUE_DOUBLE_QUOTED */;
      } else if (ch === "'") {
        this.state = "ATTR_VALUE_SQ" /* ATTR_VALUE_SINGLE_QUOTED */;
      } else if (ch === ">") {
        this.emitCurrentToken();
        this.state = "DATA" /* DATA */;
      } else {
        this.reconsume = true;
        this.state = "ATTR_VALUE_UQ" /* ATTR_VALUE_UNQUOTED */;
      }
    }
    /**
     * ATTR_VALUE_DOUBLE_QUOTED —— 双引号属性值 "..."
     */
    handleAttrValueDQ(ch) {
      if (ch === '"') {
        this.state = "AFTER_ATTR_NAME" /* AFTER_ATTR_NAME */;
      } else if (ch === "&") {
        if (this.currentAttr) this.currentAttr.value += ch;
      } else {
        if (this.currentAttr) this.currentAttr.value += ch;
      }
    }
    /**
     * ATTR_VALUE_SINGLE_QUOTED —— 单引号属性值 '...'
     */
    handleAttrValueSQ(ch) {
      if (ch === "'") {
        this.state = "AFTER_ATTR_NAME" /* AFTER_ATTR_NAME */;
      } else if (ch === "&") {
        if (this.currentAttr) this.currentAttr.value += ch;
      } else {
        if (this.currentAttr) this.currentAttr.value += ch;
      }
    }
    /**
     * ATTR_VALUE_UNQUOTED —— 无引号属性值
     *
     * 值到空格、> 或 / 为止
     */
    handleAttrValueUQ(ch) {
      if (isWhitespace(ch)) {
        this.state = "BEFORE_ATTR_NAME" /* BEFORE_ATTR_NAME */;
      } else if (ch === ">") {
        this.emitCurrentToken();
        this.state = "DATA" /* DATA */;
      } else {
        if (this.currentAttr) this.currentAttr.value += ch;
      }
    }
    /**
     * SELF_CLOSING_START_TAG —— 标签末尾的 /
     *
     * 对应 <br/> <img/> 等自闭合标签。
     * HTML 规范中，只有 foreign elements（SVG/MathML）和少数 void elements
     * 的自闭合会被正确识别。对于普通 HTML 元素，/ 会被忽略。
     */
    handleSelfClosing(ch) {
      if (ch === ">") {
        if (this.currentToken && isStartTag(this.currentToken)) {
          this.currentToken.selfClosing = true;
        }
        this.emitCurrentToken();
        this.state = "DATA" /* DATA */;
      } else {
        this.reconsume = true;
        this.state = "BEFORE_ATTR_NAME" /* BEFORE_ATTR_NAME */;
      }
    }
    /**
     * MARKUP_DECL_OPEN —— 读到了 <!
     *
     * 处理两种标记声明：
     *   - <!-- → 注释
     *   - <!DOCTYPE → 文档类型声明
     */
    handleMarkupDecl(ch) {
      if (ch === "-" && this.peek(1) === "-") {
        this.pos += 2;
        this.createCommentToken("");
        this.state = "COMMENT" /* COMMENT */;
      } else if (matchIgnoreCase(this.input, this.pos, "doctype")) {
        this.pos += 7;
        this.currentToken = createDOCTYPEToken();
        this.state = "DOCTYPE" /* DOCTYPE */;
      } else {
        while (this.pos < this.input.length && this.input[this.pos] !== ">") {
          this.pos++;
        }
        this.state = "DATA" /* DATA */;
      }
    }
    // ============================================================
    // Comment 状态（COMMENT_START / COMMENT_START_DASH / COMMENT / COMMENT_END_DASH / COMMENT_END）
    // 对应 HTML spec 的 12.2.5.5 Comment state
    // ============================================================
    handleCommentStart(ch) {
      this.state = "COMMENT" /* COMMENT */;
      this.reconsume = true;
    }
    handleCommentStartDash(ch) {
      if (ch === "-") {
        this.state = "COMMENT_END_DASH" /* COMMENT_END_DASH */;
      } else if (ch === ">") {
        this.emitCurrentToken();
        this.state = "DATA" /* DATA */;
      } else {
        if (this.currentToken) {
          this.currentToken.data += "-" + ch;
        }
        this.state = "COMMENT" /* COMMENT */;
      }
    }
    handleComment(ch) {
      if (ch === "-") {
        this.state = "COMMENT_END_DASH" /* COMMENT_END_DASH */;
      } else if (ch === "<") {
        if (this.currentToken) {
          this.currentToken.data += ch;
        }
      } else {
        if (this.currentToken) {
          this.currentToken.data += ch;
        }
      }
    }
    handleCommentEndDash(ch) {
      if (ch === "-") {
        this.state = "COMMENT_END" /* COMMENT_END */;
      } else {
        if (this.currentToken) {
          this.currentToken.data += "--" + ch;
        }
        this.state = "COMMENT" /* COMMENT */;
      }
    }
    handleCommentEnd(ch) {
      if (ch === ">") {
        this.emitCurrentToken();
        this.state = "DATA" /* DATA */;
      } else {
        if (this.currentToken) {
          this.currentToken.data += "--" + ch;
        }
        this.state = "COMMENT" /* COMMENT */;
      }
    }
    // ============================================================
    // DOCTYPE 状态
    // ============================================================
    handleDOCTYPE(ch) {
      if (isWhitespace(ch)) {
        this.state = "BEFORE_DOCTYPE_NAME" /* BEFORE_DOCTYPE_NAME */;
      } else if (ch === ">") {
        this.emitCurrentToken();
        this.state = "DATA" /* DATA */;
      } else {
        this.reconsume = true;
        this.state = "BEFORE_DOCTYPE_NAME" /* BEFORE_DOCTYPE_NAME */;
      }
    }
    handleBeforeDOCTYPEName(ch) {
      if (isWhitespace(ch)) {
        return;
      } else if (ch === ">") {
        this.currentToken.forceQuirks = true;
        this.emitCurrentToken();
        this.state = "DATA" /* DATA */;
      } else {
        if (this.currentToken) {
          this.currentToken.name = ch.toLowerCase();
        }
        this.state = "DOCTYPE_NAME" /* DOCTYPE_NAME */;
      }
    }
    handleDOCTYPEName(ch) {
      if (isWhitespace(ch)) {
        this.state = "AFTER_DOCTYPE_NAME" /* AFTER_DOCTYPE_NAME */;
      } else if (ch === ">") {
        this.emitCurrentToken();
        this.state = "DATA" /* DATA */;
      } else {
        if (this.currentToken) {
          this.currentToken.name += ch.toLowerCase();
        }
      }
    }
    handleAfterDOCTYPEName(ch) {
      if (isWhitespace(ch)) {
        return;
      } else if (ch === ">") {
        this.emitCurrentToken();
        this.state = "DATA" /* DATA */;
      } else {
        while (this.pos < this.input.length && this.input[this.pos] !== ">") {
          this.pos++;
        }
        this.emitCurrentToken();
        this.state = "DATA" /* DATA */;
      }
    }
    // ============================================================
    // RAWTEXT 状态 —— <style> 和 <script> 的内容
    //
    // 关键区别：在 RAWTEXT 中，所有字符都按字面处理（包括 < > &）
    // 唯一的例外是遇到对应的结束标签（如 </style>）
    // ============================================================
    handleRawtext(ch) {
      if (ch === "<") {
        this.flushCharacterBuffer();
        this.state = "RAWTEXT_LESS_THAN" /* RAWTEXT_LESS_THAN */;
      } else {
        this.buffer += ch;
      }
    }
    handleRawtextLT(ch) {
      if (ch === "/") {
        this.buffer = "";
        this.state = "RAWTEXT_END_TAG" /* RAWTEXT_END_TAG_OPEN */;
      } else {
        this.buffer += "<" + ch;
        this.state = "RAWTEXT" /* RAWTEXT */;
      }
    }
    handleRawtextEndTagOpen(ch) {
      if (isLetter(ch)) {
        this.buffer += ch.toLowerCase();
        this.state = "RAWTEXT_END_TAG_NAME" /* RAWTEXT_END_TAG_NAME */;
      } else {
        this.buffer += "</" + ch;
        this.state = "RAWTEXT" /* RAWTEXT */;
      }
    }
    /**
     * RAWTEXT_END_TAG_NAME —— 检查是否匹配期望的结束标签名
     *
     * 例如：在 <style> 内部遇到 </style> 时，需要从 RAWTEXT 模式退出
     */
    handleRawtextEndTagName(ch) {
      if (isLetter(ch)) {
        this.buffer += ch.toLowerCase();
      } else if (ch === ">") {
        const endTagName = this.buffer;
        const startTag = this.rawtextEndTagName;
        if (endTagName === startTag) {
          this.flushCharacterBuffer();
          this.currentToken = createEndTagToken(endTagName);
          this.emitCurrentToken();
          this.state = "DATA" /* DATA */;
        } else {
          this.buffer = "</" + this.buffer + ">";
          this.state = "RAWTEXT" /* RAWTEXT */;
        }
        this.buffer = "";
      } else if (isWhitespace(ch)) {
        if (this.buffer === this.rawtextEndTagName) {
          this.flushCharacterBuffer();
          this.currentToken = createEndTagToken(this.buffer);
          this.state = "BEFORE_ATTR_NAME" /* BEFORE_ATTR_NAME */;
        } else {
          this.buffer = "</" + this.buffer + ch;
          this.state = "RAWTEXT" /* RAWTEXT */;
        }
      } else {
        this.buffer += "</" + ch;
        this.state = "RAWTEXT" /* RAWTEXT */;
      }
    }
    // ============================================================
    // RCDATA 状态 —— <title> 和 <textarea> 的内容
    //
    // 与 RAWTEXT 类似，但 & 字符可以触发字符引用解析（简化实现）
    // ============================================================
    handleRcdata(ch) {
      if (ch === "<") {
        this.flushCharacterBuffer();
        this.state = "RCDATA_LESS_THAN" /* RCDATA_LESS_THAN */;
      } else {
        this.buffer += ch;
      }
    }
    handleRcdataLT(ch) {
      if (ch === "/") {
        this.buffer = "";
        this.state = "RCDATA_END_TAG" /* RCDATA_END_TAG_OPEN */;
      } else {
        this.buffer += "<" + ch;
        this.state = "RCDATA" /* RCDATA */;
      }
    }
    handleRcdataEndTagOpen(ch) {
      if (isLetter(ch)) {
        this.buffer += ch.toLowerCase();
        this.state = "RCDATA_END_TAG_NAME" /* RCDATA_END_TAG_NAME */;
      } else {
        this.buffer += "</" + ch;
        this.state = "RCDATA" /* RCDATA */;
      }
    }
    handleRcdataEndTagName(ch) {
      if (isLetter(ch)) {
        this.buffer += ch.toLowerCase();
      } else if (ch === ">") {
        if (this.buffer === this.rcdataEndTagName) {
          this.flushCharacterBuffer();
          this.currentToken = createEndTagToken(this.buffer);
          this.emitCurrentToken();
          this.state = "DATA" /* DATA */;
        } else {
          this.buffer = "</" + this.buffer + ">";
          this.state = "RCDATA" /* RCDATA */;
        }
        this.buffer = "";
      } else if (isWhitespace(ch)) {
        if (this.buffer === this.rcdataEndTagName) {
          this.flushCharacterBuffer();
          this.currentToken = createEndTagToken(this.buffer);
          this.state = "BEFORE_ATTR_NAME" /* BEFORE_ATTR_NAME */;
        } else {
          this.buffer = "</" + this.buffer + ch;
          this.state = "RCDATA" /* RCDATA */;
        }
      } else {
        this.buffer = "</" + ch;
        this.state = "RCDATA" /* RCDATA */;
      }
    }
    // ============================================================
    // EOF 处理
    // ============================================================
    processEOF() {
      this.flushCharacterBuffer();
      switch (this.state) {
        case "TAG_NAME" /* TAG_NAME */:
        case "BEFORE_ATTR_NAME" /* BEFORE_ATTR_NAME */:
        case "AFTER_ATTR_NAME" /* AFTER_ATTR_NAME */:
          this.emitCurrentToken();
          break;
        case "COMMENT" /* COMMENT */:
        case "COMMENT_END_DASH" /* COMMENT_END_DASH */:
          this.emitCurrentToken();
          break;
      }
      this.tokens.push(createEndOfFileToken());
    }
    // ============================================================
    // 辅助方法
    // ============================================================
    /**
     * 发射当前 token
     */
    emitCurrentToken() {
      if (this.currentToken) {
        this.tokens.push(this.currentToken);
        this.currentToken = null;
      }
    }
    /**
     * 将缓冲区中的字符文本发射为 Character token
     * 合并连续的字符可以提高解析性能
     */
    flushCharacterBuffer() {
      if (this.buffer.length > 0) {
        this.tokens.push(createCharacterToken(this.buffer));
        this.buffer = "";
      }
    }
    /**
     * 创建注释 token 并设为当前 token
     */
    createCommentToken(data) {
      this.currentToken = createCommentToken(data);
    }
    /**
     * 查看前面第 N 个字符（N 从 1 开始）
     */
    peek(n) {
      return this.pos + n < this.input.length ? this.input[this.pos + n] : "";
    }
  };
  function isWhitespace(ch) {
    return ch === " " || ch === "	" || ch === "\n" || ch === "\r" || ch === "\f";
  }
  function isLetter(ch) {
    return ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z";
  }
  function isDigit(ch) {
    return ch >= "0" && ch <= "9";
  }
  function isStartTag(token) {
    return token.type === "StartTag" /* START_TAG */;
  }
  function matchIgnoreCase(input, pos, target) {
    if (pos + target.length > input.length) return false;
    const slice = input.substring(pos, pos + target.length);
    return slice.toLowerCase() === target.toLowerCase();
  }

  // ../html-parser/src/TreeBuilder.ts
  var VOID_ELEMENTS = /* @__PURE__ */ new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr"
  ]);
  var SPECIAL_ELEMENTS = /* @__PURE__ */ new Set([
    "address",
    "applet",
    "area",
    "article",
    "aside",
    "base",
    "basefont",
    "bgsound",
    "blockquote",
    "body",
    "br",
    "button",
    "caption",
    "center",
    "col",
    "colgroup",
    "dd",
    "details",
    "dir",
    "div",
    "dl",
    "dt",
    "embed",
    "fieldset",
    "figcaption",
    "figure",
    "footer",
    "form",
    "frame",
    "frameset",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "head",
    "header",
    "hgroup",
    "hr",
    "html",
    "iframe",
    "img",
    "input",
    "li",
    "link",
    "listing",
    "main",
    "marquee",
    "meta",
    "nav",
    "noembed",
    "noframes",
    "noscript",
    "object",
    "ol",
    "p",
    "param",
    "plaintext",
    "pre",
    "script",
    "section",
    "select",
    "source",
    "style",
    "summary",
    "table",
    "tbody",
    "td",
    "template",
    "textarea",
    "tfoot",
    "th",
    "thead",
    "title",
    "tr",
    "track",
    "ul",
    "wbr",
    "xmp"
  ]);
  var HTMLTreeBuilder = class {
    // ============================================================
    // 核心数据结构
    // ============================================================
    /** 目标 Document */
    document;
    /**
     * 开放元素栈 —— 对应 HTML spec 的 "stack of open elements"
     *
     * 这是树构造器最重要的数据结构。
     * 栈中的元素代表当前未闭合的元素。
     * 栈底是 <html>，栈顶是最近打开的元素。
     * 新元素被创建时 push，遇到结束标签时 pop。
     */
    openElements = [];
    /**
     * 插入模式 —— 控制 token 的解析方式
     */
    insertionMode = "INITIAL" /* INITIAL */;
    /**
     * 当前节点指针 —— 新节点被插入到这个节点的子节点中
     * 通常是 openElements 的栈顶元素
     */
    currentNode;
    /**
     * 原始插入模式 —— 用于从 TABLE 模式恢复
     * 当进入 TABLE 相关模式时，保存之前的插入模式
     */
    originalInsertionMode = "INITIAL" /* INITIAL */;
    /**
     * 用于跟踪需要 foster parenting（领养）的元素
     */
    fosterParenting = false;
    constructor(document) {
      this.document = document || new Document();
      this.currentNode = this.document;
    }
    /**
     * 处理 token 流，构建 DOM 树
     */
    build(tokens) {
      for (const token of tokens) {
        this.processToken(token);
      }
      return this.document;
    }
    // ============================================================
    // Token 处理分发
    // ============================================================
    processToken(token) {
      switch (token.type) {
        case "DOCTYPE" /* DOCTYPE */:
          this.processDOCTYPE(token);
          break;
        case "StartTag" /* START_TAG */:
          this.processStartTag(token);
          break;
        case "EndTag" /* END_TAG */:
          this.processEndTag(token);
          break;
        case "Character" /* CHARACTER */:
          this.processCharacter(token);
          break;
        case "Comment" /* COMMENT */:
          if (this.currentNode.nodeType !== 9 /* DOCUMENT_NODE */) {
            const comment = this.document.createComment(token.data);
            this.currentNode.appendChild(comment);
          }
          break;
        case "EndOfFile" /* END_OF_FILE */:
          break;
      }
    }
    // ============================================================
    // DOCTYPE 处理
    // ============================================================
    processDOCTYPE(token) {
      this.insertionMode = "BEFORE_HTML" /* BEFORE_HTML */;
    }
    // ============================================================
    // 开始标签处理
    // ============================================================
    processStartTag(token) {
      const tagName = token.tagName;
      switch (this.insertionMode) {
        case "INITIAL" /* INITIAL */:
        case "BEFORE_HTML" /* BEFORE_HTML */:
          return this.handleStartTagBeforeHTML(token);
        case "BEFORE_HEAD" /* BEFORE_HEAD */:
          return this.handleStartTagBeforeHead(token);
        case "IN_HEAD" /* IN_HEAD */:
          return this.handleStartTagInHead(token);
        case "AFTER_HEAD" /* AFTER_HEAD */:
          return this.handleStartTagAfterHead(token);
        case "IN_BODY" /* IN_BODY */:
          return this.handleStartTagInBody(token);
        case "IN_TABLE" /* IN_TABLE */:
          return this.handleStartTagInTable(token);
        case "IN_TABLE_BODY" /* IN_TABLE_BODY */:
          return this.handleStartTagInTableBody(token);
        case "IN_ROW" /* IN_ROW */:
          return this.handleStartTagInRow(token);
        case "IN_CELL" /* IN_CELL */:
          return this.handleStartTagInCell(token);
        case "TEXT" /* TEXT */:
          break;
      }
    }
    // ============================================================
    // BEFORE_HTML 模式
    // ============================================================
    handleStartTagBeforeHTML(token) {
      if (token.tagName === "html") {
        const element = this.insertElement(token);
        this.openElements.push(element);
        this.currentNode = element;
        this.insertionMode = "BEFORE_HEAD" /* BEFORE_HEAD */;
      } else {
        const htmlEl = this.document.createElement("html");
        this.document.appendChild(htmlEl);
        this.openElements.push(htmlEl);
        this.currentNode = htmlEl;
        this.insertionMode = "BEFORE_HEAD" /* BEFORE_HEAD */;
        this.processStartTag(token);
      }
    }
    // ============================================================
    // BEFORE_HEAD 模式
    // ============================================================
    handleStartTagBeforeHead(token) {
      if (token.tagName === "html") {
        return;
      } else if (token.tagName === "head") {
        const element = this.insertElement(token);
        this.openElements.push(element);
        this.currentNode = element;
        this.insertionMode = "IN_HEAD" /* IN_HEAD */;
      } else {
        const head = this.document.createElement("head");
        this.currentNode.appendChild(head);
        this.openElements.push(head);
        this.currentNode = head;
        this.insertionMode = "IN_HEAD" /* IN_HEAD */;
        this.processStartTag(token);
      }
    }
    // ============================================================
    // IN_HEAD 模式
    // ============================================================
    handleStartTagInHead(token) {
      const tagName = token.tagName;
      if (tagName === "html") {
        this.handleStartTagBeforeHTML(token);
      } else if (tagName === "base" || tagName === "link" || tagName === "meta") {
        const el = this.insertElement(token);
        this.openElements.pop();
      } else if (tagName === "title" || tagName === "style" || tagName === "script") {
        this.originalInsertionMode = this.insertionMode;
        const el = this.insertElement(token);
        this.openElements.push(el);
        this.currentNode = el;
        this.insertionMode = "TEXT" /* TEXT */;
      } else if (tagName === "noscript") {
        this.insertElement(token);
        this.openElements.push(this._lastInserted());
      } else if (tagName === "head") {
        return;
      } else {
        this.popElement("head");
        this.insertionMode = "AFTER_HEAD" /* AFTER_HEAD */;
        this.processStartTag(token);
      }
    }
    // ============================================================
    // AFTER_HEAD 模式
    // ============================================================
    handleStartTagAfterHead(token) {
      const tagName = token.tagName;
      if (tagName === "html" || tagName === "head") {
      } else if (tagName === "body") {
        const element = this.insertElement(token);
        this.openElements.push(element);
        this.currentNode = element;
        this.insertionMode = "IN_BODY" /* IN_BODY */;
      } else if (tagName === "frameset") {
        const element = this.insertElement(token);
        this.openElements.push(element);
        this.currentNode = element;
        this.insertionMode = "IN_BODY" /* IN_BODY */;
      } else {
        const body = this.document.createElement("body");
        this.currentNode.appendChild(body);
        this.openElements.push(body);
        this.currentNode = body;
        this.insertionMode = "IN_BODY" /* IN_BODY */;
        this.processStartTag(token);
      }
    }
    // ============================================================
    // IN_BODY 模式 —— 最常用的模式，处理 body 内的标签
    //
    // 这是树构造器中最复杂的模式，处理：
    //   - 块级元素 (div, section, article, etc.)
    //   - 行内元素 (span, a, strong, etc.)
    //   - 标题元素 (h1-h6)
    //   - 列表元素 (ul, ol, li)
    //   - 段落元素 (p)
    //   - 表格相关元素 (table, tr, td)
    //   - 表单元素 (input, button, etc.)
    //   - void elements (br, img, hr, etc.)
    // ============================================================
    handleStartTagInBody(token) {
      const tagName = token.tagName;
      if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
        const headingTags = ["h1", "h2", "h3", "h4", "h5", "h6"];
        for (let i = this.openElements.length - 1; i >= 0; i--) {
          if (headingTags.includes(this.openElements[i].tagName.toLowerCase())) {
            this.popElementUntil(this.openElements[i].tagName);
            break;
          }
        }
        this.insertElementAndPush(token);
        return;
      }
      if (tagName === "p") {
        this.closePElement();
        this.insertElementAndPush(token);
        return;
      }
      if (tagName === "li") {
        this.closeLIElement();
        this.insertElementAndPush(token);
        return;
      }
      if (tagName === "table") {
        this.closePElement();
        const element = this.insertElement(token);
        this.openElements.push(element);
        this.currentNode = element;
        this.insertionMode = "IN_TABLE" /* IN_TABLE */;
        return;
      }
      if (tagName === "tr") {
        this.closePElement();
        this.createImpliedElement("tbody");
        const element = this.insertElement(token);
        this.openElements.push(element);
        this.currentNode = element;
        this.insertionMode = "IN_ROW" /* IN_ROW */;
        return;
      }
      if (tagName === "td" || tagName === "th") {
        this.createImpliedElement("tr");
        const element = this.insertElement(token);
        this.openElements.push(element);
        this.currentNode = element;
        this.insertionMode = "IN_CELL" /* IN_CELL */;
        return;
      }
      if (tagName === "thead" || tagName === "tbody" || tagName === "tfoot") {
        this.closePElement();
        const element = this.insertElement(token);
        this.openElements.push(element);
        this.currentNode = element;
        this.insertionMode = "IN_TABLE_BODY" /* IN_TABLE_BODY */;
        return;
      }
      if (VOID_ELEMENTS.has(tagName)) {
        this.closePElement();
        const element = this.insertElement(token);
        return;
      }
      if ([
        "div",
        "section",
        "article",
        "aside",
        "nav",
        "header",
        "footer",
        "main",
        "figure",
        "figcaption",
        "blockquote",
        "details",
        "dialog",
        "fieldset",
        "form",
        "center",
        "address"
      ].includes(tagName)) {
        this.closePElement();
      }
      this.insertElementAndPush(token);
    }
    // ============================================================
    // IN_TABLE 模式
    // ============================================================
    handleStartTagInTable(token) {
      const tagName = token.tagName;
      if (tagName === "caption") {
        this.clearStackToTableContext();
        this.openElements.push(this.insertElement(token));
        this.insertionMode = "IN_TABLE" /* IN_TABLE */;
      } else if (tagName === "colgroup" || tagName === "col") {
        this.clearStackToTableContext();
        this.insertElement(token);
      } else if (tagName === "thead" || tagName === "tbody" || tagName === "tfoot") {
        this.clearStackToTableContext();
        const el = this.insertElement(token);
        this.openElements.push(el);
        this.currentNode = el;
        this.insertionMode = "IN_TABLE_BODY" /* IN_TABLE_BODY */;
      } else if (tagName === "tr") {
        this.clearStackToTableContext();
        this.createImpliedElement("tbody");
        const el = this.insertElement(token);
        this.openElements.push(el);
        this.currentNode = el;
        this.insertionMode = "IN_ROW" /* IN_ROW */;
      } else if (tagName === "td" || tagName === "th") {
        this.clearStackToTableContext();
        this.createImpliedElement("tbody");
        this.createImpliedElement("tr");
        const el = this.insertElement(token);
        this.openElements.push(el);
        this.currentNode = el;
        this.insertionMode = "IN_CELL" /* IN_CELL */;
      } else {
        this.handleTokenInTableWithFosterParenting(token);
      }
    }
    // ============================================================
    // IN_TABLE_BODY 模式
    // ============================================================
    handleStartTagInTableBody(token) {
      if (token.tagName === "tr") {
        this.clearStackToTableBodyContext();
        const el = this.insertElement(token);
        this.openElements.push(el);
        this.currentNode = el;
        this.insertionMode = "IN_ROW" /* IN_ROW */;
      } else if (token.tagName === "td" || token.tagName === "th") {
        this.clearStackToTableBodyContext();
        this.createImpliedElement("tr");
        const el = this.insertElement(token);
        this.openElements.push(el);
        this.currentNode = el;
        this.insertionMode = "IN_CELL" /* IN_CELL */;
      } else {
        this.handleTokenInTableWithFosterParenting(token);
      }
    }
    // ============================================================
    // IN_ROW 模式
    // ============================================================
    handleStartTagInRow(token) {
      if (token.tagName === "td" || token.tagName === "th") {
        this.clearStackToTableRowContext();
        const el = this.insertElement(token);
        this.openElements.push(el);
        this.currentNode = el;
        this.insertionMode = "IN_CELL" /* IN_CELL */;
      } else {
        this.handleTokenInTableWithFosterParenting(token);
      }
    }
    // ============================================================
    // IN_CELL 模式
    // ============================================================
    handleStartTagInCell(token) {
      this.insertElementAndPush(token);
    }
    // ============================================================
    // 结束标签处理
    // ============================================================
    processEndTag(token) {
      const tagName = token.tagName;
      switch (this.insertionMode) {
        case "INITIAL" /* INITIAL */:
        case "BEFORE_HTML" /* BEFORE_HTML */:
        case "BEFORE_HEAD" /* BEFORE_HEAD */:
          break;
        case "IN_HEAD" /* IN_HEAD */:
          if (tagName === "head") {
            this.popElement("head");
            this.insertionMode = "AFTER_HEAD" /* AFTER_HEAD */;
          }
          break;
        case "AFTER_HEAD" /* AFTER_HEAD */:
          if (tagName === "body" || tagName === "html") {
          }
          break;
        case "IN_BODY" /* IN_BODY */:
          this.handleEndTagInBody(tagName);
          break;
        case "IN_TABLE" /* IN_TABLE */:
          if (tagName === "table") {
            this.popElement("table");
            this.resetInsertionMode();
          }
          break;
        case "IN_TABLE_BODY" /* IN_TABLE_BODY */:
          if (tagName === "tbody" || tagName === "thead" || tagName === "tfoot") {
            this.popElement(tagName);
            this.insertionMode = "IN_TABLE" /* IN_TABLE */;
          } else if (tagName === "table") {
            this.popElement("table");
            this.resetInsertionMode();
          }
          break;
        case "IN_ROW" /* IN_ROW */:
          if (tagName === "tr") {
            this.popElement("tr");
            this.insertionMode = "IN_TABLE_BODY" /* IN_TABLE_BODY */;
          } else if (tagName === "table") {
            this.popElement("tr");
            this.insertionMode = "IN_TABLE_BODY" /* IN_TABLE_BODY */;
            this.processEndTag(token);
          }
          break;
        case "IN_CELL" /* IN_CELL */:
          if (tagName === "td" || tagName === "th") {
            this.popElement(tagName);
            this.insertionMode = "IN_ROW" /* IN_ROW */;
          }
          break;
        case "TEXT" /* TEXT */:
          if (tagName === "title" || tagName === "style" || tagName === "script" || tagName === "textarea") {
            this.popElement(tagName);
            this.insertionMode = this.originalInsertionMode;
          }
          break;
      }
    }
    /**
     * IN_BODY 模式下的结束标签处理
     *
     * 结束标签的处理规则：
     *   - 在开放元素栈中查找匹配的标签
     *   - 弹出途中经过的所有不在特殊元素列表中的元素
     *   - 特殊元素不会被子元素的结束标签自动关闭
     */
    handleEndTagInBody(tagName) {
      if (tagName === "body" || tagName === "html") {
        return;
      }
      if (tagName === "html") {
        return;
      }
      if (this.hasElementInStack(tagName)) {
        if (tagName === "p") {
          this.closePElement();
          return;
        }
        if (tagName === "li") {
          this.closeLIElement();
          return;
        }
        this.popElementUntil(tagName);
      }
    }
    // ============================================================
    // 字符处理
    // ============================================================
    processCharacter(token) {
      const text = this.document.createTextNode(token.data);
      this.currentNode.appendChild(text);
    }
    // ============================================================
    // 元素操作辅助方法
    // ============================================================
    /**
     * 创建元素，设置属性，插入到当前节点的子节点列表中
     * 对应 Blink 的 HTMLConstructionSite::insertElement
     */
    insertElement(token) {
      const element = this.document.createElement(token.tagName);
      for (const attr of token.attributes) {
        element.setAttribute(attr.name, attr.value);
      }
      this.currentNode.appendChild(element);
      return element;
    }
    /**
     * 创建元素，设置属性，插入，并 push 到开放元素栈
     */
    insertElementAndPush(token) {
      const element = this.insertElement(token);
      if (!VOID_ELEMENTS.has(token.tagName) && !token.selfClosing) {
        this.openElements.push(element);
        this.currentNode = element;
      }
      return element;
    }
    /**
     * 隐式创建元素（如 table 内部缺失的 tbody）
     */
    createImpliedElement(tagName) {
      if (!this.hasElementInStack(tagName)) {
        const element = this.document.createElement(tagName);
        this.currentNode.appendChild(element);
        this.openElements.push(element);
        this.currentNode = element;
      }
    }
    /**
     * 从开放元素栈弹出指定元素
     */
    popElement(tagName) {
      for (let i = this.openElements.length - 1; i >= 0; i--) {
        if (this.openElements[i].tagName.toLowerCase() === tagName) {
          this.openElements.splice(i, 1);
          this.currentNode = this.openElements.length > 0 ? this.openElements[this.openElements.length - 1] : this.document;
          return;
        }
      }
    }
    /**
     * 弹出直到（包括）指定元素
     */
    popElementUntil(tagName) {
      for (let i = this.openElements.length - 1; i >= 0; i--) {
        if (this.openElements[i].tagName.toLowerCase() === tagName) {
          this.openElements.splice(i, 1);
          break;
        }
        if (!SPECIAL_ELEMENTS.has(this.openElements[i].tagName.toLowerCase())) {
          this.openElements.splice(i, 1);
        }
      }
      this.currentNode = this.openElements.length > 0 ? this.openElements[this.openElements.length - 1] : this.document.documentElement || this.document;
    }
    /**
     * 关闭当前打开的 p 元素
     * p 元素是特殊的：遇到 <p>、</p> 或其他块级元素时会自动关闭
     */
    closePElement() {
      this.popElementUntil("p");
    }
    /**
     * 关闭当前打开的 li 元素
     */
    closeLIElement() {
      this.popElementUntil("li");
    }
    /**
     * 检查开放元素栈中是否有指定标签
     */
    hasElementInStack(tagName) {
      return this.openElements.some((el) => el.tagName.toLowerCase() === tagName);
    }
    /**
     * 清除堆栈直到 table 上下文
     */
    clearStackToTableContext() {
      while (this.openElements.length > 0 && this.openElements[this.openElements.length - 1].tagName.toLowerCase() !== "table") {
        this.openElements.pop();
      }
      this.currentNode = this.openElements[this.openElements.length - 1] || this.document;
    }
    /**
     * 清除堆栈直到 table body 上下文
     */
    clearStackToTableBodyContext() {
      while (this.openElements.length > 0) {
        const tagName = this.openElements[this.openElements.length - 1].tagName.toLowerCase();
        if (tagName === "tbody" || tagName === "thead" || tagName === "tfoot" || tagName === "table") {
          break;
        }
        this.openElements.pop();
      }
      this.currentNode = this.openElements[this.openElements.length - 1] || this.document;
    }
    /**
     * 清除堆栈直到 table row 上下文
     */
    clearStackToTableRowContext() {
      while (this.openElements.length > 0) {
        const tagName = this.openElements[this.openElements.length - 1].tagName.toLowerCase();
        if (tagName === "tr" || tagName === "table") {
          break;
        }
        this.openElements.pop();
      }
      this.currentNode = this.openElements[this.openElements.length - 1] || this.document;
    }
    /**
     * 在 table 上下文中处理不属于 table 的 token
     * 触发 foster parenting（领养机制）
     */
    handleTokenInTableWithFosterParenting(token) {
      this.insertElementAndPush(token);
    }
    /**
     * 恢复之前的插入模式
     */
    resetInsertionMode() {
      this.insertionMode = this.originalInsertionMode;
    }
    /**
     * 获取最后插入的元素
     */
    _lastInserted() {
      return this.openElements.length > 0 ? this.openElements[this.openElements.length - 1] : null;
    }
  };

  // ../html-parser/src/Parser.ts
  var HTMLParser = class {
    tokenizer;
    treeBuilder;
    constructor() {
      this.tokenizer = new HTMLTokenizer();
      this.treeBuilder = new HTMLTreeBuilder();
    }
    /**
     * 解析 HTML 字符串，返回 DOM Document
     *
     * @param html 完整的 HTML 源代码
     * @returns 构建好的 Document 对象（DOM 树的根）
     */
    parse(html) {
      const tokens = this.tokenizer.tokenize(html);
      const document = new Document();
      this.treeBuilder = new HTMLTreeBuilder(document);
      return this.treeBuilder.build(tokens);
    }
  };

  // ../css-parser/src/CSSTokenizer.ts
  var CSSTokenType = /* @__PURE__ */ ((CSSTokenType2) => {
    CSSTokenType2["IDENT"] = "ident";
    CSSTokenType2["FUNCTION"] = "function";
    CSSTokenType2["AT_KEYWORD"] = "at-keyword";
    CSSTokenType2["HASH"] = "hash";
    CSSTokenType2["STRING"] = "string";
    CSSTokenType2["NUMBER"] = "number";
    CSSTokenType2["PERCENTAGE"] = "percentage";
    CSSTokenType2["DIMENSION"] = "dimension";
    CSSTokenType2["WHITESPACE"] = "whitespace";
    CSSTokenType2["COLON"] = "colon";
    CSSTokenType2["SEMICOLON"] = "semicolon";
    CSSTokenType2["COMMA"] = "comma";
    CSSTokenType2["OPEN_BRACE"] = "open-brace";
    CSSTokenType2["CLOSE_BRACE"] = "close-brace";
    CSSTokenType2["OPEN_PAREN"] = "open-paren";
    CSSTokenType2["CLOSE_PAREN"] = "close-paren";
    CSSTokenType2["OPEN_BRACKET"] = "open-bracket";
    CSSTokenType2["CLOSE_BRACKET"] = "close-bracket";
    CSSTokenType2["DELIM"] = "delim";
    CSSTokenType2["EOF"] = "eof";
    return CSSTokenType2;
  })(CSSTokenType || {});
  var CSSTokenizer = class {
    input = "";
    pos = 0;
    tokens = [];
    /**
     * 对输入的 CSS 文本进行词法分析
     */
    tokenize(input) {
      this.input = input;
      this.pos = 0;
      this.tokens = [];
      while (this.pos < this.input.length) {
        const ch = this.current();
        if (isWhitespace2(ch)) {
          this.consumeWhitespace();
          continue;
        }
        if (ch === '"' || ch === "'") {
          this.tokens.push(this.consumeString());
          continue;
        }
        if (ch === "#") {
          this.tokens.push(this.consumeHash());
          continue;
        }
        if (ch === "+" || ch === "-" || ch === ".") {
          if (ch === "+" || ch === "-") {
            const next = this.peek(1);
            if (isDigit2(next) || next === "." && isDigit2(this.peek(2) || "")) {
              this.tokens.push(this.consumeNumeric());
              continue;
            }
          } else if (ch === "." && isDigit2(this.peek(1) || "")) {
            this.tokens.push(this.consumeNumeric());
            continue;
          }
        }
        if (isDigit2(ch)) {
          this.tokens.push(this.consumeNumeric());
          continue;
        }
        if (ch === "@") {
          this.tokens.push(this.consumeAtKeyword());
          continue;
        }
        if (isIdentStart(ch)) {
          this.tokens.push(this.consumeIdent());
          continue;
        }
        if (ch === "\\") {
          this.tokens.push(this.consumeIdent());
          continue;
        }
        this.tokens.push(this.consumeDelim());
      }
      this.tokens.push({ type: "eof" /* EOF */, value: "" });
      return this.tokens;
    }
    // ============================================================
    // Token 消费者
    // ============================================================
    /**
     * 消费空格 —— 合并连续空格
     */
    consumeWhitespace() {
      let value = "";
      while (this.pos < this.input.length && isWhitespace2(this.current())) {
        value += this.current();
        this.pos++;
      }
      this.tokens.push({ type: "whitespace" /* WHITESPACE */, value });
    }
    /**
     * 消费字符串 —— "..." 或 '...'
     */
    consumeString() {
      const quote = this.current();
      let value = "";
      this.pos++;
      while (this.pos < this.input.length) {
        const ch = this.current();
        if (ch === quote) {
          this.pos++;
          return { type: "string" /* STRING */, value };
        } else if (ch === "\\") {
          this.pos++;
          if (this.pos < this.input.length) {
            value += this.current();
            this.pos++;
          }
        } else if (ch === "\n" || ch === "\r") {
          return { type: "string" /* STRING */, value };
        } else {
          value += ch;
          this.pos++;
        }
      }
      return { type: "string" /* STRING */, value };
    }
    /**
     * 消费 # —— Hash token
     */
    consumeHash() {
      this.pos++;
      let value = "";
      const hashType = isIdentStart(this.current()) ? "id" : "unrestricted";
      while (this.pos < this.input.length && isIdentChar(this.current())) {
        value += this.current();
        this.pos++;
      }
      return {
        type: "hash" /* HASH */,
        value: `#${value}`,
        hashType
      };
    }
    /**
     * 消费数值 —— 数字/百分比/维度，如 16、50%、2em、1.5px
     */
    consumeNumeric() {
      let value = "";
      let numericValue;
      if (this.current() === "+" || this.current() === "-") {
        value += this.current();
        this.pos++;
      }
      while (this.pos < this.input.length && isDigit2(this.current())) {
        value += this.current();
        this.pos++;
      }
      if (this.current() === "." && isDigit2(this.peek(1) || "")) {
        value += this.current();
        this.pos++;
        while (this.pos < this.input.length && isDigit2(this.current())) {
          value += this.current();
          this.pos++;
        }
      }
      numericValue = parseFloat(value);
      if (this.current() === "%") {
        this.pos++;
        return {
          type: "percentage" /* PERCENTAGE */,
          value: `${value}%`,
          numericValue: numericValue / 100
        };
      }
      if (isIdentStart(this.current())) {
        let unit = "";
        while (this.pos < this.input.length && isIdentChar(this.current())) {
          unit += this.current();
          this.pos++;
        }
        return {
          type: "dimension" /* DIMENSION */,
          value: `${value}${unit}`,
          numericValue,
          unit
        };
      }
      return {
        type: "number" /* NUMBER */,
        value,
        numericValue
      };
    }
    /**
     * 消费 @ 关键字 —— @media、@import 等
     */
    consumeAtKeyword() {
      this.pos++;
      let value = "";
      while (this.pos < this.input.length && isIdentChar(this.current())) {
        value += this.current();
        this.pos++;
      }
      return {
        type: "at-keyword" /* AT_KEYWORD */,
        value: `@${value}`
      };
    }
    /**
     * 消费标识符 —— 属性名、关键字、选择器等
     * 例如：color, display, div, rgb
     *
     * 重要：函数调用如 rgb( 会被识别为 function token
     */
    consumeIdent() {
      let value = "";
      while (this.pos < this.input.length && isIdentChar(this.current())) {
        value += this.current();
        this.pos++;
      }
      if (this.current() === "(") {
        this.pos++;
        return {
          type: "function" /* FUNCTION */,
          value: `${value}(`
        };
      }
      return {
        type: "ident" /* IDENT */,
        value
      };
    }
    /**
     * 消费分隔符 —— 单个字符（: ; , { } ( ) [ ] 等）
     */
    consumeDelim() {
      const ch = this.current();
      this.pos++;
      const DELIM_MAP = {
        ":": "colon" /* COLON */,
        ";": "semicolon" /* SEMICOLON */,
        ",": "comma" /* COMMA */,
        "{": "open-brace" /* OPEN_BRACE */,
        "}": "close-brace" /* CLOSE_BRACE */,
        "(": "open-paren" /* OPEN_PAREN */,
        ")": "close-paren" /* CLOSE_PAREN */,
        "[": "open-bracket" /* OPEN_BRACKET */,
        "]": "close-bracket" /* CLOSE_BRACKET */
      };
      const type = DELIM_MAP[ch] || "delim" /* DELIM */;
      return { type, value: ch };
    }
    // ============================================================
    // 输入辅助
    // ============================================================
    current() {
      return this.pos < this.input.length ? this.input[this.pos] : "";
    }
    peek(n) {
      return this.pos + n < this.input.length ? this.input[this.pos + n] : "";
    }
  };
  function isWhitespace2(ch) {
    return ch === " " || ch === "	" || ch === "\n" || ch === "\r" || ch === "\f";
  }
  function isDigit2(ch) {
    return ch >= "0" && ch <= "9";
  }
  function isIdentStart(ch) {
    if (!ch) return false;
    if (ch === "-" || ch === "_") return true;
    if (ch >= "a" && ch <= "z") return true;
    if (ch >= "A" && ch <= "Z") return true;
    if (ch.charCodeAt(0) > 127) return true;
    return false;
  }
  function isIdentChar(ch) {
    if (isIdentStart(ch)) return true;
    if (isDigit2(ch)) return true;
    return false;
  }

  // ../css-parser/src/SelectorParser.ts
  var SelectorParser = class {
    input = "";
    pos = 0;
    /**
     * 解析选择器列表字符串
     * 例如："h1, h2.title, div > p" → [ComplexSelector, ComplexSelector, ComplexSelector]
     *
     * 逗号分隔的是多个独立的选择器（选择器列表）
     */
    parse(selectorText) {
      this.input = selectorText.trim();
      this.pos = 0;
      const selectors = [];
      while (this.pos < this.input.length) {
        this.skipWhitespace();
        if (this.pos >= this.input.length) break;
        const complex = this.parseComplexSelector();
        if (complex) {
          selectors.push(complex);
        }
        this.skipWhitespace();
        if (this.current() === ",") {
          this.pos++;
        }
      }
      return selectors;
    }
    /**
     * 解析一个复杂选择器
     * 例如：div.container > p + span
     */
    parseComplexSelector() {
      const compounds = [];
      const combinators = [];
      let specificity = [0, 0, 0];
      while (this.pos < this.input.length) {
        this.skipWhitespace();
        const combinator = this.readCombinator();
        if (combinator) {
          combinators.push(combinator);
          this.skipWhitespace();
        } else if (compounds.length > 0) {
          combinators.push("descendant");
        }
        if (this.isEndOfSelector()) break;
        if (compounds.length > 0 && !combinator) {
        }
        const compound = this.parseCompoundSelector();
        if (!compound) break;
        compounds.push(compound);
        const [a, b, c] = compoundToSpecificity(compound);
        specificity = [
          specificity[0] + a,
          specificity[1] + b,
          specificity[2] + c
        ];
      }
      if (compounds.length === 0) return null;
      return { compounds, combinators, specificity };
    }
    /**
     * 解析一个复合选择器
     * 例如：div.container#main[data-x="y"]:hover
     *
     * 复合选择器由多个简单选择器组成，它们之间没有组合器分隔。
     * 所有条件必须同时满足（AND 关系）。
     */
    parseCompoundSelector() {
      const compound = {
        tagName: null,
        id: null,
        classes: [],
        attributes: [],
        pseudoClasses: []
      };
      while (this.pos < this.input.length) {
        this.skipWhitespace();
        const ch = this.current();
        if (!ch || this.isEndOfSelector() || this.isCombinator(ch)) break;
        if (ch === "#") {
          const id = this.readID();
          if (id) {
            compound.id = id;
          }
          continue;
        }
        if (ch === ".") {
          const cls = this.readClass();
          if (cls) {
            compound.classes.push(cls);
          }
          continue;
        }
        if (ch === "[") {
          const attr = this.readAttribute();
          if (attr) {
            compound.attributes.push(attr);
          }
          continue;
        }
        if (ch === ":") {
          const pc = this.readPseudoClass();
          if (pc) {
            compound.pseudoClasses.push(pc);
          }
          continue;
        }
        if (isIdentStart2(ch) || ch === "-") {
          const ident = this.readIdent();
          if (ident && ident === "*") {
          } else if (ident) {
            compound.tagName = ident.toLowerCase();
          }
          continue;
        }
        this.pos++;
      }
      return compound;
    }
    // ============================================================
    // 简单选择器读取
    // ============================================================
    /**
     * 读取 ID 选择器：#main
     */
    readID() {
      this.pos++;
      return this.readIdent();
    }
    /**
     * 读取类选择器：.container
     */
    readClass() {
      this.pos++;
      return this.readIdent();
    }
    /**
     * 读取属性选择器：[attr], [attr=value], [attr~=value] 等
     */
    readAttribute() {
      this.pos++;
      this.skipWhitespace();
      const name = this.readIdent();
      if (!name) return null;
      this.skipWhitespace();
      const ch = this.current();
      if (ch === "]") {
        this.pos++;
        return { name, operator: null, value: null };
      }
      let operator = "=";
      if (ch === "=" || ch === "~" || ch === "|" || ch === "^" || ch === "$" || ch === "*") {
        const next = this.peek(1);
        if (next === "=") {
          this.pos += 2;
          operator = ch === "=" ? "=" : ch === "~" ? "~=" : ch === "|" ? "|=" : ch === "^" ? "^=" : ch === "$" ? "$=" : "*=";
        } else {
          this.pos++;
        }
      }
      this.skipWhitespace();
      let value = null;
      const quote = this.current();
      if (quote === '"' || quote === "'") {
        this.pos++;
        let val = "";
        while (this.pos < this.input.length && this.current() !== quote) {
          val += this.current();
          this.pos++;
        }
        value = val;
        if (this.current() === quote) this.pos++;
      } else {
        value = this.readIdent() || "";
      }
      this.skipWhitespace();
      if (this.current() === "]") this.pos++;
      return { name, operator, value };
    }
    /**
     * 读取伪类选择器：:hover, :first-child, :nth-child(2n+1)
     */
    readPseudoClass() {
      this.pos++;
      const name = this.readIdent();
      if (!name) return null;
      let argument = null;
      if (this.current() === "(") {
        this.pos++;
        let arg = "";
        let depth = 1;
        while (this.pos < this.input.length && depth > 0) {
          const ch = this.current();
          if (ch === "(") depth++;
          if (ch === ")") depth--;
          if (depth > 0) arg += ch;
          this.pos++;
        }
        argument = arg;
      }
      return { name, argument };
    }
    // ============================================================
    // 组合器识别
    // ============================================================
    /**
     * 读取组合器：>, +, ~
     * 返回 null 表示没有显式组合器（隐式后代选择器）
     */
    readCombinator() {
      const ch = this.current();
      if (ch === ">") {
        this.pos++;
        return "child";
      }
      if (ch === "+") {
        this.pos++;
        return "adjacent-sibling";
      }
      if (ch === "~") {
        this.pos++;
        return "general-sibling";
      }
      return null;
    }
    /**
     * 检查当前字符是否是组合器
     */
    isCombinator(ch) {
      return ch === ">" || ch === "+" || ch === "~";
    }
    /**
     * 检查是否到达选择器结束
     */
    isEndOfSelector() {
      const ch = this.current();
      if (!ch) return true;
      if (ch === ",") return true;
      if (ch === "{") return true;
      return false;
    }
    // ============================================================
    // 辅助函数
    // ============================================================
    /**
     * 读取标识符（字母、数字、连字符组成的名字）
     */
    readIdent() {
      let ident = "";
      while (this.pos < this.input.length && isIdentChar2(this.current())) {
        ident += this.current();
        this.pos++;
      }
      return ident || null;
    }
    current() {
      return this.pos < this.input.length ? this.input[this.pos] : "";
    }
    peek(n) {
      return this.pos + n < this.input.length ? this.input[this.pos + n] : "";
    }
    skipWhitespace() {
      while (this.pos < this.input.length && isWhitespace3(this.current())) {
        this.pos++;
      }
    }
  };
  function isWhitespace3(ch) {
    return ch === " " || ch === "	" || ch === "\n" || ch === "\r";
  }
  function isIdentStart2(ch) {
    if (!ch) return false;
    if (ch === "-" || ch === "_") return true;
    if (ch >= "a" && ch <= "z") return true;
    if (ch >= "A" && ch <= "Z") return true;
    if (ch.charCodeAt(0) > 127) return true;
    return false;
  }
  function isIdentChar2(ch) {
    if (isIdentStart2(ch)) return true;
    if (ch >= "0" && ch <= "9") return true;
    return false;
  }
  function compoundToSpecificity(compound) {
    let a = 0, b = 0, c = 0;
    if (compound.id) a++;
    b += compound.classes.length;
    b += compound.attributes.length;
    b += compound.pseudoClasses.length;
    if (compound.tagName) c++;
    return [a, b, c];
  }

  // ../css-parser/src/CSSParser.ts
  var CSSParser = class {
    tokenizer;
    selectorParser;
    tokens = [];
    pos = 0;
    constructor() {
      this.tokenizer = new CSSTokenizer();
      this.selectorParser = new SelectorParser();
    }
    /**
     * 解析 CSS 文本为样式表
     *
     * @param cssText CSS 源代码
     * @param origin 样式来源（作者/用户代理/用户）
     */
    parse(cssText, origin = "author" /* AUTHOR */) {
      this.tokens = this.tokenizer.tokenize(cssText);
      this.pos = 0;
      const rules = [];
      while (!this.isEOF()) {
        this.skipWhitespace();
        if (this.isEOF()) break;
        const rule = this.parseRule();
        if (rule) {
          rules.push(rule);
        }
      }
      return { rules, origin };
    }
    /**
     * 解析一条 CSS 规则
     * 例如：h1, h2.title { color: red; margin: 10px 20px; }
     */
    parseRule() {
      this.skipWhitespace();
      if (this.current().type === "at-keyword" /* AT_KEYWORD */) {
        this.skipAtRule();
        return null;
      }
      const selectorText = this.consumeUntilBrace();
      if (!selectorText) {
        this.skipToNextRule();
        return null;
      }
      let selectors;
      try {
        selectors = this.selectorParser.parse(selectorText);
      } catch {
        this.skipToNextRule();
        return null;
      }
      const declarations = this.parseDeclarationList();
      if (declarations.length === 0) {
        return null;
      }
      return { selectors, declarations };
    }
    /**
     * 解析 { } 内部的声明列表
     * 例如：color: red; margin: 10px 20px;
     */
    parseDeclarationList() {
      const declarations = [];
      this.skipWhitespace();
      if (this.current().type !== "open-brace" /* OPEN_BRACE */) {
        return declarations;
      }
      this.pos++;
      while (!this.isEOF()) {
        this.skipWhitespace();
        if (this.current().type === "close-brace" /* CLOSE_BRACE */) {
          this.pos++;
          break;
        }
        const declaration = this.parseDeclaration();
        if (declaration) {
          declarations.push(declaration);
        } else {
          this.skipToNextDeclaration();
        }
      }
      return declarations;
    }
    /**
     * 解析单个声明
     * 例如：color: red !important
     */
    parseDeclaration() {
      this.skipWhitespace();
      if (this.current().type !== "ident" /* IDENT */) {
        return null;
      }
      const property = this.current().value;
      this.pos++;
      this.skipWhitespace();
      if (this.current().type !== "colon" /* COLON */) {
        return null;
      }
      this.pos++;
      this.skipWhitespace();
      const value = this.parseValue();
      if (!value) {
        return null;
      }
      let important = false;
      this.skipWhitespace();
      if (this.current().type === "delim" /* DELIM */ && this.current().value === "!") {
        this.pos++;
        this.skipWhitespace();
        if (this.current().type === "ident" /* IDENT */ && this.current().value.toLowerCase() === "important") {
          this.pos++;
          important = true;
        }
      }
      this.skipWhitespace();
      if (this.current().type === "semicolon" /* SEMICOLON */) {
        this.pos++;
      }
      return { property, value, important };
    }
    /**
     * 解析 CSS 值
     *
     * CSS 值可以是：
     *   - 单个关键字：auto, none, block
     *   - 数值 + 单位：16px, 2em, 50%
     *   - 颜色：red, #ff0000, rgb(255, 0, 0)
     *   - 函数：calc(), rgba(), var()
     *   - 复合值：1px solid red（表现为多个值的序列）
     *
     * 简化处理：将值序列拼接到一起，解析第一个值为主要类型
     */
    parseValue() {
      const token = this.current();
      if (token.type === "ident" /* IDENT */) {
        this.pos++;
        return this.resolveKeywordValue(token.value);
      }
      if (token.type === "dimension" /* DIMENSION */) {
        this.pos++;
        return {
          type: "length",
          value: token.numericValue,
          unit: token.unit
        };
      }
      if (token.type === "percentage" /* PERCENTAGE */) {
        this.pos++;
        return { type: "percentage", value: token.numericValue * 100 };
      }
      if (token.type === "number" /* NUMBER */) {
        this.pos++;
        return { type: "number", value: token.numericValue };
      }
      if (token.type === "hash" /* HASH */) {
        this.pos++;
        return this.parseHexColor(token.value);
      }
      if (token.type === "function" /* FUNCTION */) {
        return this.parseFunctionValue();
      }
      if (token.type === "string" /* STRING */) {
        this.pos++;
        return { type: "string", value: token.value };
      }
      return null;
    }
    /**
     * 解析函数值：rgb(255, 0, 0), calc(100% - 10px) 等
     */
    parseFunctionValue() {
      const funcName = this.current().value.replace("(", "");
      this.pos++;
      const args = [];
      let argText = "";
      while (!this.isEOF() && this.current().type !== "close-paren" /* CLOSE_PAREN */) {
        if (this.current().type === "comma" /* COMMA */) {
          if (argText.trim()) {
            args.push({ type: "number", value: parseFloat(argText.trim()) || 0 });
            argText = "";
          }
          this.pos++;
        } else {
          argText += this.current().value;
          this.pos++;
        }
      }
      if (argText.trim()) {
        args.push({ type: "number", value: parseFloat(argText.trim()) || 0 });
      }
      if (this.current().type === "close-paren" /* CLOSE_PAREN */) {
        this.pos++;
      }
      if ((funcName === "rgb" || funcName === "rgba") && args.length >= 3) {
        const r = Math.min(255, Math.max(0, extractNumber(args[0])));
        const g = Math.min(255, Math.max(0, extractNumber(args[1])));
        const b = Math.min(255, Math.max(0, extractNumber(args[2])));
        const a = args.length >= 4 ? Math.min(1, Math.max(0, extractNumber(args[3]))) : 1;
        return { type: "color", r, g, b, a };
      }
      return { type: "function", name: funcName, args };
    }
    /**
     * 解析十六进制颜色：#ff0000 → { r: 255, g: 0, b: 0, a: 1 }
     */
    parseHexColor(hex) {
      let h = hex.replace("#", "");
      if (h.length === 3) {
        h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      }
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return { type: "color", r, g, b, a: 1 };
    }
    /**
     * 将关键字值解析为具体类型
     * 例如：auto → keyword, red → color
     */
    resolveKeywordValue(keyword) {
      const COLOR_MAP = {
        red: [255, 0, 0],
        blue: [0, 0, 255],
        green: [0, 128, 0],
        black: [0, 0, 0],
        white: [255, 255, 255],
        yellow: [255, 255, 0],
        purple: [128, 0, 128],
        orange: [255, 165, 0],
        gray: [128, 128, 128],
        grey: [128, 128, 128],
        transparent: [0, 0, 0],
        pink: [255, 192, 203],
        cyan: [0, 255, 255],
        magenta: [255, 0, 255],
        lime: [0, 255, 0],
        navy: [0, 0, 128],
        teal: [0, 128, 128],
        aqua: [0, 255, 255],
        maroon: [128, 0, 0],
        silver: [192, 192, 192],
        olive: [128, 128, 0]
      };
      if (keyword === "transparent") {
        return { type: "color", r: 0, g: 0, b: 0, a: 0 };
      }
      const color = COLOR_MAP[keyword.toLowerCase()];
      if (color) {
        return { type: "color", r: color[0], g: color[1], b: color[2], a: 1 };
      }
      return { type: "keyword", value: keyword };
    }
    // ============================================================
    // Token 流辅助方法
    // ============================================================
    current() {
      return this.pos < this.tokens.length ? this.tokens[this.pos] : { type: "eof" /* EOF */, value: "" };
    }
    isEOF() {
      return this.current().type === "eof" /* EOF */;
    }
    /**
     * 跳过空格
     */
    skipWhitespace() {
      while (this.current().type === "whitespace" /* WHITESPACE */) {
        this.pos++;
      }
    }
    /**
     * 收集从当前位置到 { 之前的所有 token 文本（选择器部分）
     */
    consumeUntilBrace() {
      let text = "";
      let depth = 0;
      while (!this.isEOF()) {
        const token = this.current();
        if (token.type === "open-brace" /* OPEN_BRACE */ && depth === 0) {
          break;
        }
        if (token.type === "open-paren" /* OPEN_PAREN */) {
          depth++;
        }
        if (token.type === "close-paren" /* CLOSE_PAREN */) {
          depth--;
        }
        text += token.value;
        this.pos++;
      }
      return text.trim();
    }
    /**
     * 跳过 @ 规则（如 @media { ... }）
     */
    skipAtRule() {
      let braceDepth = 0;
      while (!this.isEOF()) {
        const token = this.current();
        if (token.type === "open-brace" /* OPEN_BRACE */) braceDepth++;
        if (token.type === "close-brace" /* CLOSE_BRACE */) {
          braceDepth--;
          if (braceDepth <= 0) {
            this.pos++;
            break;
          }
        }
        if (braceDepth === 0 && token.type === "semicolon" /* SEMICOLON */) {
          this.pos++;
          break;
        }
        this.pos++;
      }
    }
    /**
     * 跳到下一条规则
     */
    skipToNextRule() {
      while (!this.isEOF()) {
        const token = this.current();
        if (token.type === "close-brace" /* CLOSE_BRACE */) {
          this.pos++;
          return;
        }
        this.pos++;
      }
    }
    /**
     * 跳到下一个声明（跳过非法内容）
     */
    skipToNextDeclaration() {
      while (!this.isEOF()) {
        const token = this.current();
        if (token.type === "semicolon" /* SEMICOLON */) {
          this.pos++;
          return;
        }
        if (token.type === "close-brace" /* CLOSE_BRACE */) {
          return;
        }
        this.pos++;
      }
    }
  };
  function extractNumber(v) {
    if ("value" in v && typeof v.value === "number") {
      return v.value;
    }
    return 0;
  }

  // ../style/src/SelectorMatcher.ts
  function matchesSelector(selector, element) {
    const compounds = selector.compounds;
    const combinators = selector.combinators;
    if (compounds.length === 0) return false;
    let compoundIndex = compounds.length - 1;
    let currentElement = element;
    if (!matchesCompound(compounds[compoundIndex], currentElement)) {
      return false;
    }
    compoundIndex--;
    while (compoundIndex >= 0 && currentElement) {
      const combinator = combinators[compoundIndex];
      const nextElement = findMatchingAncestor(
        compounds[compoundIndex],
        currentElement,
        combinator
      );
      if (!nextElement) return false;
      currentElement = nextElement;
      compoundIndex--;
    }
    return compoundIndex < 0;
  }
  function matchesCompound(compound, element) {
    if (compound.tagName && compound.tagName !== "*") {
      if (element.tagName.toLowerCase() !== compound.tagName.toLowerCase()) {
        return false;
      }
    }
    if (compound.id) {
      if (element.id !== compound.id) {
        return false;
      }
    }
    for (const cls of compound.classes) {
      if (!element.classList.contains(cls)) {
        return false;
      }
    }
    for (const attr of compound.attributes) {
      const attrValue = element.getAttribute(attr.name);
      if (!attr.operator || attr.value === null || attr.value === "") {
        if (attrValue === null) return false;
        continue;
      }
      if (attrValue === null) return false;
      switch (attr.operator) {
        case "=":
          if (attrValue !== attr.value) return false;
          break;
        case "~=":
          if (!attrValue.split(/\s+/).includes(attr.value)) return false;
          break;
        case "|=":
          if (attrValue !== attr.value && !attrValue.startsWith(attr.value + "-")) return false;
          break;
        case "^=":
          if (!attrValue.startsWith(attr.value)) return false;
          break;
        case "$=":
          if (!attrValue.endsWith(attr.value)) return false;
          break;
        case "*=":
          if (!attrValue.includes(attr.value)) return false;
          break;
      }
    }
    for (const pc of compound.pseudoClasses) {
      if (!matchesPseudoClass(pc.name, element)) {
        return false;
      }
    }
    return true;
  }
  function matchesPseudoClass(name, element) {
    switch (name) {
      case "first-child":
        return element.parentNode?.firstChild === element;
      case "last-child":
        return element.parentNode?.lastChild === element;
      case "only-child":
        return element.parentNode?.firstChild === element && element.parentNode?.lastChild === element;
      case "hover":
      case "focus":
      case "active":
      case "visited":
      case "link":
        return true;
      case "root":
        return element.parentNode?.nodeType === 9 /* DOCUMENT_NODE */;
      default:
        return true;
    }
  }
  function findMatchingAncestor(compound, startElement, combinator) {
    switch (combinator) {
      case "descendant":
        let ancestor = startElement.parentNode;
        while (ancestor) {
          if (ancestor.nodeType === 1 /* ELEMENT_NODE */ && matchesCompound(compound, ancestor)) {
            return ancestor;
          }
          ancestor = ancestor.parentNode;
        }
        return null;
      case "child":
        const parent = startElement.parentNode;
        if (parent && parent.nodeType === 1 /* ELEMENT_NODE */ && matchesCompound(compound, parent)) {
          return parent;
        }
        return null;
      case "adjacent-sibling":
        let prev = startElement.previousSibling;
        while (prev) {
          if (prev.nodeType === 1 /* ELEMENT_NODE */ && matchesCompound(compound, prev)) {
            return prev;
          }
          prev = prev.previousSibling;
        }
        return null;
      case "general-sibling":
        let prevSib = startElement.previousSibling;
        while (prevSib) {
          if (prevSib.nodeType === 1 /* ELEMENT_NODE */ && matchesCompound(compound, prevSib)) {
            return prevSib;
          }
          prevSib = prevSib.previousSibling;
        }
        return null;
      default:
        return null;
    }
  }

  // ../style/src/Specificity.ts
  function calculateSpecificity(selector) {
    let a = 0, b = 0, c = 0;
    for (const compound of selector.compounds) {
      if (compound.id) a++;
      b += compound.classes.length;
      b += compound.attributes.length;
      b += compound.pseudoClasses.length;
      if (compound.tagName) c++;
    }
    return [a, b, c];
  }
  function compareSpecificity(a, b) {
    if (a[0] !== b[0]) return a[0] - b[0];
    if (a[1] !== b[1]) return a[1] - b[1];
    return a[2] - b[2];
  }

  // ../style/src/ComputedStyleDefaults.ts
  function createDefaultComputedStyle() {
    return {
      // 盒模型
      display: "inline",
      // 初始值：inline
      width: "auto",
      height: "auto",
      minWidth: 0,
      maxWidth: Infinity,
      minHeight: 0,
      maxHeight: Infinity,
      // 内边距（初始值：0）
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      // 边框（初始值：0，但 table 等元素的 UA 样式会覆盖）
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      // 外边距（初始值：0）
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      // 定位（初始值：static）
      position: "static",
      top: "auto",
      right: "auto",
      bottom: "auto",
      left: "auto",
      // 排版
      fontSize: 16,
      // 用户代理默认值：16px（约 12pt）
      fontFamily: "serif",
      fontWeight: 400,
      // normal
      fontStyle: "normal",
      lineHeight: 20,
      // 约 1.2 * fontSize
      textAlign: "left",
      whiteSpace: "normal",
      // 颜色
      color: { r: 0, g: 0, b: 0, a: 1 },
      // 初始值：黑色
      backgroundColor: null,
      // 初始值：透明
      // 其他
      overflow: "visible",
      opacity: 1,
      zIndex: 0,
      boxSizing: "content-box",
      // Flex（初始值）
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "stretch",
      flexGrow: 0,
      flexShrink: 1,
      flexBasis: "auto"
    };
  }
  var INHERITED_PROPERTIES = /* @__PURE__ */ new Set([
    "color",
    "fontSize",
    "fontFamily",
    "fontWeight",
    "fontStyle",
    "lineHeight",
    "textAlign",
    "whiteSpace",
    "visibility",
    "cursor"
  ]);

  // ../style/src/StyleResolver.ts
  var StyleResolver = class {
    // 用户代理样式（内置默认样式）
    uaStylesheet = null;
    constructor(uaStylesheet) {
      this.uaStylesheet = uaStylesheet || null;
    }
    /**
     * 对整棵 DOM 树执行样式解析
     *
     * @param document DOM 文档
     * @param authorStylesheets 作者样式表列表（网页中 <style> 和 <link> 的样式）
     */
    resolve(document, authorStylesheets) {
      const allStylesheets = [];
      if (this.uaStylesheet) {
        allStylesheets.push(this.uaStylesheet);
      }
      allStylesheets.push(...authorStylesheets);
      this.resolveElement(document, document.documentElement, allStylesheets, null);
    }
    /**
     * 递归计算单个元素及其子元素的样式
     *
     * @param document 文档对象
     * @param element 当前元素
     * @param stylesheets 所有样式表
     * @param parentStyle 父元素的计算样式（用于继承）
     */
    resolveElement(document, element, stylesheets, parentStyle) {
      const computedStyle = createDefaultComputedStyle();
      if (parentStyle) {
        this.applyInheritance(computedStyle, parentStyle);
      }
      this.applyInlineStyle(computedStyle, element);
      const declarations = this.collectMatchingDeclarations(element, stylesheets);
      declarations.sort((a, b) => this.cascadeCompare(a, b));
      for (const decl of declarations) {
        this.applyDeclaration(computedStyle, decl);
      }
      element.computedStyle = computedStyle;
      let child = element.firstChild;
      while (child) {
        if (child.nodeType === 1 /* ELEMENT_NODE */) {
          this.resolveElement(document, child, stylesheets, computedStyle);
        }
        child = child.nextSibling;
      }
    }
    /**
     * 收集所有匹配某个元素的样式声明
     *
     * 这是 Chrome 中 MatchResult 的简化版本。
     * 对于元素，遍历所有样式表中的所有规则，
     * 检查选择器是否匹配，如果匹配则收集其声明。
     */
    collectMatchingDeclarations(element, stylesheets) {
      const result = [];
      let order = 0;
      for (const sheet of stylesheets) {
        for (const rule of sheet.rules) {
          for (const selector of rule.selectors) {
            if (matchesSelector(selector, element)) {
              const specificity = selector.specificity;
              for (const decl of rule.declarations) {
                result.push({
                  property: decl.property,
                  value: decl.value,
                  important: decl.important,
                  origin: sheet.origin,
                  specificity,
                  sourceOrder: order++
                });
              }
              break;
            }
          }
        }
      }
      return result;
    }
    /**
     * 层叠比较函数 —— 决定哪个声明优先
     *
     * 这是 CSS 层叠的核心算法：
     *   1. 来源 + !important 优先级最高
     *      - 用户代理 !important > 用户 !important > 作者 !important > 作者普通 > 用户普通 > 用户代理普通
     *   2. 相同来源，比较特异性
     *   3. 相同特异性，比较源码顺序（后出现的优先）
     *
     * @returns > 0: a 优先于 b, < 0: b 优先于 a
     */
    cascadeCompare(a, b) {
      const priorityA = this.getCascadePriority(a.origin, a.important);
      const priorityB = this.getCascadePriority(b.origin, b.important);
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      const specCmp = compareSpecificity(a.specificity, b.specificity);
      if (specCmp !== 0) return specCmp;
      return a.sourceOrder - b.sourceOrder;
    }
    /**
     * 获取来源 + !important 的优先级分数
     *
     * Chrome 的层叠优先级（从低到高）：
     * 0: 用户代理普通
     * 1: 用户普通
     * 2: 作者普通
     * 3: 动画          （本实现暂不支持）
     * 4: 作者 !important
     * 5: 用户 !important
     * 6: 用户代理 !important
     * 7: 过渡          （本实现暂不支持）
     */
    getCascadePriority(origin, important) {
      if (important) {
        switch (origin) {
          case "author" /* AUTHOR */:
            return 4;
          case "user" /* USER */:
            return 5;
          case "user-agent" /* USER_AGENT */:
            return 6;
        }
      } else {
        switch (origin) {
          case "user-agent" /* USER_AGENT */:
            return 0;
          case "user" /* USER */:
            return 1;
          case "author" /* AUTHOR */:
            return 2;
        }
      }
      return 0;
    }
    /**
     * 应用单个样式声明到计算样式
     *
     * 将 CSS 解析出的值转换为计算样式的具体数值。
     * 处理单位转换（em → px）、颜色解析、关键字映射等。
     */
    applyDeclaration(style, decl) {
      const { property, value } = decl;
      switch (property) {
        // 盒模型
        case "display":
          if (value.type === "keyword") {
            const validDisplays = [
              "block",
              "inline",
              "inline-block",
              "flex",
              "none",
              "table",
              "table-row",
              "table-cell",
              "list-item",
              "table-header-group",
              "table-row-group",
              "table-footer-group"
            ];
            if (validDisplays.includes(value.value)) {
              style.display = value.value;
            }
          }
          break;
        case "width":
          style.width = resolveLength(value, style.fontSize, 0);
          break;
        case "height":
          style.height = resolveLength(value, style.fontSize, 0);
          break;
        // 内边距
        case "padding":
          if (value.type === "length") {
            style.paddingTop = style.paddingRight = style.paddingBottom = style.paddingLeft = resolveLength(value, style.fontSize, 0);
          }
          break;
        case "padding-top":
          style.paddingTop = resolveLength(value, style.fontSize, 0);
          break;
        case "padding-right":
          style.paddingRight = resolveLength(value, style.fontSize, 0);
          break;
        case "padding-bottom":
          style.paddingBottom = resolveLength(value, style.fontSize, 0);
          break;
        case "padding-left":
          style.paddingLeft = resolveLength(value, style.fontSize, 0);
          break;
        // 外边距
        case "margin":
          if (value.type === "length") {
            const val = resolveLength(value, style.fontSize, 0);
            style.marginTop = style.marginRight = style.marginBottom = style.marginLeft = val;
          } else if (value.type === "keyword" && value.value === "auto") {
            style.marginTop = style.marginRight = style.marginBottom = style.marginLeft = "auto";
          }
          break;
        case "margin-top":
          style.marginTop = resolveLengthOrAuto(value, style.fontSize);
          break;
        case "margin-right":
          style.marginRight = resolveLengthOrAuto(value, style.fontSize);
          break;
        case "margin-bottom":
          style.marginBottom = resolveLengthOrAuto(value, style.fontSize);
          break;
        case "margin-left":
          style.marginLeft = resolveLengthOrAuto(value, style.fontSize);
          break;
        // 边框宽度
        case "border-top-width":
          style.borderTopWidth = resolveLength(value, style.fontSize, 0);
          break;
        case "border-right-width":
          style.borderRightWidth = resolveLength(value, style.fontSize, 0);
          break;
        case "border-bottom-width":
          style.borderBottomWidth = resolveLength(value, style.fontSize, 0);
          break;
        case "border-left-width":
          style.borderLeftWidth = resolveLength(value, style.fontSize, 0);
          break;
        // 排版
        case "font-size":
          if (value.type === "length") {
            style.fontSize = resolveToPx(value, style.fontSize);
          } else if (value.type === "percentage") {
            style.fontSize = style.fontSize * (value.value / 100);
          }
          break;
        case "font-weight":
          if (value.type === "keyword") {
            if (value.value === "bold") style.fontWeight = 700;
            else if (value.value === "normal") style.fontWeight = 400;
          } else if (value.type === "number") {
            style.fontWeight = value.value;
          }
          break;
        case "font-style":
          if (value.type === "keyword" && (value.value === "normal" || value.value === "italic")) {
            style.fontStyle = value.value;
          }
          break;
        case "font-family":
          if (value.type === "string" || value.type === "keyword") {
            style.fontFamily = value.value;
          }
          break;
        case "line-height":
          if (value.type === "number") {
            style.lineHeight = value.value;
          } else if (value.type === "length") {
            style.lineHeight = resolveToPx(value, style.fontSize);
          }
          break;
        case "text-align":
          if (value.type === "keyword") {
            const valid = ["left", "right", "center", "justify"];
            if (valid.includes(value.value)) style.textAlign = value.value;
          }
          break;
        case "white-space":
          if (value.type === "keyword" && (value.value === "normal" || value.value === "nowrap" || value.value === "pre")) {
            style.whiteSpace = value.value;
          }
          break;
        // 颜色
        case "color":
          if (value.type === "color") {
            style.color = { r: value.r, g: value.g, b: value.b, a: value.a };
          }
          break;
        case "background-color":
          if (value.type === "color") {
            style.backgroundColor = { r: value.r, g: value.g, b: value.b, a: value.a };
          } else if (value.type === "keyword" && value.value === "transparent") {
            style.backgroundColor = null;
          }
          break;
        // 定位
        case "position":
          if (value.type === "keyword") {
            const valid = ["static", "relative", "absolute", "fixed"];
            if (valid.includes(value.value)) style.position = value.value;
          }
          break;
        // 其他
        case "overflow":
          if (value.type === "keyword") {
            const valid = ["visible", "hidden", "scroll", "auto"];
            if (valid.includes(value.value)) style.overflow = value.value;
          }
          break;
        case "opacity":
          if (value.type === "number") {
            style.opacity = Math.min(1, Math.max(0, value.value));
          }
          break;
        case "z-index":
          if (value.type === "number") {
            style.zIndex = value.value;
          }
          break;
        case "box-sizing":
          if (value.type === "keyword" && (value.value === "content-box" || value.value === "border-box")) {
            style.boxSizing = value.value;
          }
          break;
        case "text-decoration":
          break;
        // Flex 属性
        case "display":
          break;
      }
    }
    /**
     * 应用内联样式到计算样式
     * 内联样式（<div style="color: red">）的优先级高于所有外部样式（仅次于 !important）
     */
    applyInlineStyle(style, element) {
      const inlineStyle = element.style;
      if (!inlineStyle || !inlineStyle.cssText) return;
      const props = {
        color: inlineStyle.getPropertyValue("color"),
        "background-color": inlineStyle.getPropertyValue("background-color"),
        display: inlineStyle.getPropertyValue("display"),
        "font-size": inlineStyle.getPropertyValue("font-size"),
        "font-weight": inlineStyle.getPropertyValue("font-weight"),
        margin: inlineStyle.getPropertyValue("margin"),
        padding: inlineStyle.getPropertyValue("padding"),
        width: inlineStyle.getPropertyValue("width"),
        height: inlineStyle.getPropertyValue("height")
      };
      for (const [prop, val] of Object.entries(props)) {
        if (!val) continue;
        const item = {
          property: prop,
          value: parseInlineValue(val),
          important: false,
          origin: "author" /* AUTHOR */,
          specificity: [1, 0, 0],
          // 内联样式的特异性等同于 [1,0,0]
          sourceOrder: 0
        };
        this.applyDeclaration(style, item);
      }
    }
    /**
     * 从父元素继承可继承的属性
     */
    applyInheritance(style, parentStyle) {
      for (const prop of INHERITED_PROPERTIES) {
        style[prop] = parentStyle[prop];
      }
    }
  };
  function resolveToPx(value, fontSize) {
    if (value.type === "length") {
      switch (value.unit) {
        case "px":
          return value.value;
        case "em":
          return value.value * fontSize;
        case "rem":
          return value.value * 16;
        // 根字体大小简化为 16px
        case "pt":
          return value.value * 4 / 3;
        // 1pt ≈ 1.333px
        default:
          return value.value;
      }
    }
    if (value.type === "number") return value.value;
    return 0;
  }
  function resolveLength(value, fontSize, fallback) {
    if (value.type === "keyword" && value.value === "auto") {
      return fallback;
    }
    return resolveToPx(value, fontSize);
  }
  function resolveLengthOrAuto(value, fontSize) {
    if (value.type === "keyword" && value.value === "auto") {
      return "auto";
    }
    return resolveToPx(value, fontSize);
  }
  function parseInlineValue(val) {
    if (val.startsWith("#")) {
      let h = val.replace("#", "");
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      return {
        type: "color",
        r: parseInt(h.substring(0, 2), 16),
        g: parseInt(h.substring(2, 4), 16),
        b: parseInt(h.substring(4, 6), 16),
        a: 1
      };
    }
    const numMatch = val.match(/^([\d.]+)(px|em|rem|%|pt)$/);
    if (numMatch) {
      const num = parseFloat(numMatch[1]);
      const unit = numMatch[2];
      if (unit === "%") return { type: "percentage", value: num };
      return { type: "length", value: num, unit };
    }
    const pureNum = parseFloat(val);
    if (!isNaN(pureNum)) {
      return { type: "number", value: pureNum };
    }
    return { type: "keyword", value: val };
  }

  // ../style/src/user-agent.ts
  var USER_AGENT_CSS = `
html, body { display: block; }

head { display: none; }
title { display: none; }
meta { display: none; }
link { display: none; }
style { display: none; }
script { display: none; }

body { margin: 8px; }

div { display: block; }
p { display: block; margin: 1em 0; }
h1 { display: block; font-size: 2em; margin: 0.67em 0; font-weight: bold; }
h2 { display: block; font-size: 1.5em; margin: 0.83em 0; font-weight: bold; }
h3 { display: block; font-size: 1.17em; margin: 1em 0; font-weight: bold; }
h4 { display: block; font-size: 1em; margin: 1.33em 0; font-weight: bold; }
h5 { display: block; font-size: 0.83em; margin: 1.67em 0; font-weight: bold; }
h6 { display: block; font-size: 0.67em; margin: 2.33em 0; font-weight: bold; }

ul, ol { display: block; margin: 1em 0; padding-left: 40px; }
li { display: list-item; }
dl { display: block; margin: 1em 0; }
dt { display: block; }
dd { display: block; margin-left: 40px; }

table { display: table; }
thead { display: table-header-group; }
tbody { display: table-row-group; }
tfoot { display: table-footer-group; }
tr { display: table-row; }
td, th { display: table-cell; }

span { display: inline; }
a { display: inline; color: blue; text-decoration: underline; }
strong { display: inline; font-weight: bold; }
em { display: inline; font-style: italic; }
img { display: inline-block; }
br { display: inline; }

hr { display: block; margin: 0.5em 0; border-width: 1px 0 0 0; }

pre { display: block; margin: 1em 0; white-space: pre; font-family: monospace; }
code { font-family: monospace; }
blockquote { display: block; margin: 1em 40px; }

form { display: block; }
input { display: inline-block; }
button { display: inline-block; }
textarea { display: inline-block; }
select { display: inline-block; }

section, article, aside, nav, header, footer, main, figure, figcaption {
  display: block;
}

details { display: block; }
summary { display: block; }
`;

  // ../layout/src/LayoutBoxImpl.ts
  var nextId = 0;
  function createLayoutBox(element, parent = null) {
    const style = element.computedStyle;
    if (!style) return null;
    if (style.display === "none") return null;
    const layoutMode = displayToLayoutMode(style.display);
    const box = {
      id: `box_${nextId++}`,
      element,
      // 位置和尺寸默认为 0，由布局引擎填充
      rect: { x: 0, y: 0, width: 0, height: 0 },
      // 盒模型边缘（从计算样式复制）
      margin: {
        top: typeof style.marginTop === "number" ? style.marginTop : 0,
        right: typeof style.marginRight === "number" ? style.marginRight : 0,
        bottom: typeof style.marginBottom === "number" ? style.marginBottom : 0,
        left: typeof style.marginLeft === "number" ? style.marginLeft : 0
      },
      border: {
        top: style.borderTopWidth,
        right: style.borderRightWidth,
        bottom: style.borderBottomWidth,
        left: style.borderLeftWidth
      },
      padding: {
        top: style.paddingTop,
        right: style.paddingRight,
        bottom: style.paddingBottom,
        left: style.paddingLeft
      },
      layoutMode,
      parent,
      children: [],
      textContent: null,
      style
    };
    return box;
  }
  function createTextLayoutBox(text, parent) {
    const parentStyle = parent.style;
    return {
      id: `text_${nextId++}`,
      element: null,
      // 文本盒子没有对应的元素
      rect: { x: 0, y: 0, width: 0, height: 0 },
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      border: { top: 0, right: 0, bottom: 0, left: 0 },
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      layoutMode: "inline" /* INLINE */,
      parent,
      children: [],
      textContent: text,
      style: parentStyle
      // 使用父元素的样式
    };
  }
  function buildLayoutTree(element, parent = null) {
    const box = createLayoutBox(element, parent);
    if (!box) return null;
    let child = element.firstChild;
    while (child) {
      if (child.nodeType === 1 /* ELEMENT_NODE */) {
        const childBox = buildLayoutTree(child, box);
        if (childBox) {
          box.children.push(childBox);
        }
      } else if (child.nodeType === 3 /* TEXT_NODE */) {
        const textContent = child.textContent;
        if (textContent.trim()) {
          const textBox = createTextLayoutBox(textContent, box);
          box.children.push(textBox);
        }
      }
      child = child.nextSibling;
    }
    return box;
  }
  function displayToLayoutMode(display) {
    switch (display) {
      case "block":
      case "list-item":
      case "table":
      case "table-row":
      case "table-cell":
      case "table-row-group":
      case "table-header-group":
      case "table-footer-group":
        return "block" /* BLOCK */;
      case "inline":
        return "inline" /* INLINE */;
      case "inline-block":
        return "block" /* BLOCK */;
      // 行内块表现为块级，但由 IFC 管理位置
      case "flex":
        return "flex" /* FLEX */;
      case "none":
      default:
        return "block" /* BLOCK */;
    }
  }

  // ../layout/src/LayoutEngine.ts
  var LayoutEngine = class {
    // 视口尺寸（初始包含块）
    viewportWidth;
    viewportHeight;
    constructor(viewportWidth = 800, viewportHeight = 600) {
      this.viewportWidth = viewportWidth;
      this.viewportHeight = viewportHeight;
    }
    /**
     * 对文档执行布局计算
     *
     * @returns 布局树的根节点（所有盒子的位置和尺寸已计算完成）
     */
    layout(documentElement) {
      const rootBox = buildLayoutTree(documentElement);
      if (!rootBox) {
        throw new Error("Cannot layout: no root layout box");
      }
      rootBox.rect = {
        x: 0,
        y: 0,
        width: this.viewportWidth,
        height: this.viewportHeight
      };
      this.layoutBox(rootBox, this.viewportWidth);
      return rootBox;
    }
    /**
     * 对单个盒子执行布局
     *
     * @param box 要布局的盒子
     * @param containingBlockWidth 包含块的内容区宽度
     *
     * Chrome 中对应 LayoutBox::Layout() 方法。
     * 根据盒子的 display 类型分派到不同的布局算法：
     *   - block → layoutBlock
     *   - inline → layoutInline
     */
    layoutBox(box, containingBlockWidth) {
      switch (box.layoutMode) {
        case "block" /* BLOCK */:
          this.layoutBlock(box, containingBlockWidth);
          break;
        case "inline" /* INLINE */:
          this.layoutInline(box, containingBlockWidth);
          break;
        case "flex" /* FLEX */:
          this.layoutBlock(box, containingBlockWidth);
          break;
      }
    }
    // ============================================================
    // 块级布局（BFC — Block Formatting Context）
    //
    // 对应 Chrome 的 LayoutBlockFlow::LayoutBlockChildren()
    //
    // 块级布局的核心规则：
    //   1. 宽度由包含块决定（width: auto 时填满整个包含块）
    //   2. 子元素垂直排列，每个子元素的 y = 前一个子元素的底部
    //   3. 高度由子元素的内容确定（自动撑高）
    //   4. 相邻块级子元素之间发生外边距合并
    // ============================================================
    layoutBlock(box, containingBlockWidth) {
      const style = box.style;
      const contentWidth = this.getContentWidth(containingBlockWidth, box);
      let currentY = box.padding.top;
      let previousChildBottomMargin = 0;
      const blockChildren = [];
      const inlineChildren = [];
      for (const child of box.children) {
        if (child.layoutMode === "block" /* BLOCK */) {
          blockChildren.push(child);
        } else {
          inlineChildren.push(child);
        }
      }
      for (const child of blockChildren) {
        const collapsedMargin = this.collapseMargins(
          previousChildBottomMargin,
          child.margin.top
        );
        if (blockChildren.indexOf(child) === 0) {
          currentY += child.margin.top;
        } else {
          if (collapsedMargin > previousChildBottomMargin) {
            currentY += collapsedMargin - previousChildBottomMargin;
          }
        }
        child.rect.x = box.padding.left + child.margin.left;
        child.rect.y = currentY;
        this.layoutBox(child, contentWidth);
        const childTotalHeight = child.rect.height + child.margin.top + child.margin.bottom + child.border.top + child.border.bottom + child.padding.top + child.padding.bottom;
        currentY = child.rect.y + child.rect.height + child.padding.top + child.padding.bottom + child.border.top + child.border.bottom + child.margin.bottom;
        previousChildBottomMargin = child.margin.bottom;
      }
      if (inlineChildren.length > 0) {
        this.layoutInlineChildren(box, inlineChildren, contentWidth, currentY);
        currentY += box.padding.bottom;
      }
      if (style.height === "auto") {
        box.rect.height = currentY + box.padding.bottom;
      } else {
        box.rect.height = style.height;
      }
      box.rect.width = contentWidth;
      box.rect.height = Math.max(style.minHeight, Math.min(style.maxHeight, box.rect.height));
    }
    // ============================================================
    // 行内布局（IFC — Inline Formatting Context）
    //
    // 对应 Chrome 的 LayoutInline / InlineFlowBox
    //
    // 行内布局的核心规则：
    //   1. 行内元素（span, a, em 等）和文本从左向右水平排列
    //   2. 当行宽超过包含块宽度时换行
    //   3. 每行的高度由行内元素的最大高度决定（line-height 影响）
    //   4. 文本在行内基线对齐
    // ============================================================
    layoutInline(box, containingBlockWidth) {
      const contentWidth = containingBlockWidth;
      let currentX = 0;
      let currentY = 0;
      let lineHeight = box.style.lineHeight || box.style.fontSize * 1.2;
      for (const child of box.children) {
        if (child.textContent !== null) {
          const textWidth = this.measureText(child.textContent, child.style.fontSize);
          if (currentX + textWidth > contentWidth && currentX > 0) {
            currentX = 0;
            currentY += lineHeight;
          }
          child.rect.x = currentX;
          child.rect.y = currentY;
          child.rect.width = textWidth;
          child.rect.height = lineHeight;
          currentX += textWidth;
        } else if (child.layoutMode === "inline" /* INLINE */) {
          this.layoutInline(child, contentWidth - currentX);
          child.rect.x = currentX;
          child.rect.y = currentY;
          currentX += child.rect.width;
        }
      }
      if (box.children.length > 0) {
        box.rect.height = currentY + lineHeight;
      } else {
        box.rect.height = lineHeight;
      }
      box.rect.width = contentWidth;
    }
    /**
     * 在块级容器内布局行内子元素
     * 这是 BFC 中的 IFC 部分
     */
    layoutInlineChildren(container, children, contentWidth, startY) {
      let currentX = container.padding.left;
      let currentY = startY;
      let lineHeight = container.style.lineHeight || container.style.fontSize * 1.2;
      let maxLineHeight = lineHeight;
      for (const child of children) {
        if (child.textContent !== null) {
          const textWidth = this.measureText(child.textContent, child.style.fontSize);
          if (currentX + textWidth > contentWidth + container.padding.left && currentX > container.padding.left) {
            currentX = container.padding.left;
            currentY += maxLineHeight;
            maxLineHeight = lineHeight;
          }
          child.rect.x = currentX;
          child.rect.y = currentY;
          child.rect.width = textWidth;
          child.rect.height = lineHeight;
          currentX += textWidth;
          maxLineHeight = Math.max(maxLineHeight, lineHeight);
        } else if (child.layoutMode === "inline" /* INLINE */) {
          this.layoutInline(child, contentWidth);
          child.rect.x = currentX;
          child.rect.y = currentY;
          currentX += child.rect.width;
          maxLineHeight = Math.max(maxLineHeight, child.rect.height);
        }
      }
    }
    // ============================================================
    // 辅助方法
    // ============================================================
    /**
     * 计算元素的内容区宽度
     *
     * Chrome 中块级元素的宽度计算（简化）：
     *   contentWidth = containingBlockWidth - marginLeft - marginRight
     *                   - borderLeft - borderRight - paddingLeft - paddingRight
     *
     * box-sizing: border-box 时，width 包含了 padding 和 border
     */
    getContentWidth(containingBlockWidth, box) {
      const style = box.style;
      if (style.width !== "auto") {
        if (style.boxSizing === "border-box") {
          return style.width;
        }
        return style.width;
      }
      const horizontalMargin = (typeof style.marginLeft === "number" ? style.marginLeft : 0) + (typeof style.marginRight === "number" ? style.marginRight : 0);
      const horizontalPadding = style.paddingLeft + style.paddingRight;
      const horizontalBorder = style.borderLeftWidth + style.borderRightWidth;
      return containingBlockWidth - horizontalMargin - horizontalPadding - horizontalBorder;
    }
    /**
     * 外边距合并算法
     *
     * 对应 Chrome 的 LayoutBlock::CollapseMargins()
     *
     * 规则：
     *   - 只有垂直外边距会合并（margin-top 和 margin-bottom）
     *   - 只有相邻的块级元素之间会合并
     *   - 合并后的值 = max(margin1, margin2)（正值）
     *   - 负值会与正值抵消
     *
     * 例如：
     *   div1 { margin-bottom: 20px; }
     *   div2 { margin-top: 30px; }
     *   → 它们之间的间距 = max(20, 30) = 30px（不是 50px）
     */
    collapseMargins(margin1, margin2) {
      if (margin1 >= 0 && margin2 >= 0) {
        return Math.max(margin1, margin2);
      }
      if (margin1 >= 0 && margin2 < 0) {
        return margin1 + margin2;
      }
      if (margin1 < 0 && margin2 >= 0) {
        return margin1 + margin2;
      }
      return Math.min(margin1, margin2);
    }
    /**
     * 测量文本宽度
     *
     * Chrome 使用复杂的文本测量引擎（HarfBuzz + 字体系统）。
     * 这里简化为：每个字符宽度 ≈ fontSize * 0.6（等宽近似）
     *
     * 中文字符宽度 ≈ fontSize，英文 ≈ fontSize * 0.6
     */
    measureText(text, fontSize) {
      let width = 0;
      for (const ch of text) {
        if (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch)) {
          width += fontSize;
        } else if (ch === " ") {
          width += fontSize * 0.3;
        } else {
          width += fontSize * 0.6;
        }
      }
      return width;
    }
  };

  // ../renderer-process/src/Pipeline.ts
  var RenderPipeline = class {
    htmlParser;
    cssParser;
    styleResolver;
    layoutEngine;
    constructor(viewportWidth = 800, viewportHeight = 600) {
      this.htmlParser = new HTMLParser();
      this.cssParser = new CSSParser();
      const uaStylesheet = this.cssParser.parse(USER_AGENT_CSS, "user-agent" /* USER_AGENT */);
      this.styleResolver = new StyleResolver(uaStylesheet);
      this.layoutEngine = new LayoutEngine(viewportWidth, viewportHeight);
    }
    /**
     * 执行完整的渲染流水线
     *
     * @param html HTML 源代码
     * @param cssList 额外的 CSS 样式表（来自 <style> 标签）
     * @returns 文档和布局结果
     */
    render(html, cssList = []) {
      const document = this.htmlParser.parse(html);
      const authorStylesheets = cssList.map(
        (css) => this.cssParser.parse(css, "author" /* AUTHOR */)
      );
      this.styleResolver.resolve(document, authorStylesheets);
      const layoutRoot = this.layoutEngine.layout(document.documentElement);
      return { document, layoutRoot };
    }
  };

  // ../output/src/LayoutViewer.ts
  var LayoutViewer = class {
    /**
     * 将布局树渲染为可读的文本格式
     */
    render(root) {
      return this.renderBox(root, "", 0);
    }
    renderBox(box, indent, depth) {
      if (depth > 20) return "";
      let result = "";
      let label = "";
      if (box.textContent !== null) {
        const text = box.textContent.substring(0, 40).replace(/\n/g, "\\n");
        label = `TEXT "${text}"`;
      } else if (box.element) {
        const el = box.element;
        const id = el.id ? `#${el.id}` : "";
        const classes = el.className ? `.${el.className.replace(/\s+/g, ".")}` : "";
        label = `<${el.tagName.toLowerCase()}${id}${classes}>`;
      } else {
        label = "(anonymous)";
      }
      const r = box.rect;
      const pos = `(${r.x.toFixed(0)}, ${r.y.toFixed(0)})`;
      const size = `${r.width.toFixed(0)} \xD7 ${r.height.toFixed(0)}`;
      const boxModel = [
        `m:(${box.margin.top},${box.margin.right},${box.margin.bottom},${box.margin.left})`,
        `b:(${box.border.top},${box.border.right},${box.border.bottom},${box.border.left})`,
        `p:(${box.padding.top},${box.padding.right},${box.padding.bottom},${box.padding.left})`
      ].join(" ");
      result += `${indent}[${box.layoutMode}] ${label}
`;
      result += `${indent}  pos:${pos} size:${size}
`;
      result += `${indent}  ${boxModel}
`;
      for (const child of box.children) {
        result += this.renderBox(child, indent + "  ", depth + 1);
      }
      return result;
    }
    /**
     * 序列化布局树（用于 IPC 传输）
     */
    serialize(box) {
      return {
        id: box.id,
        tagName: box.element?.tagName.toLowerCase() || null,
        rect: { ...box.rect },
        margin: { ...box.margin },
        border: { ...box.border },
        padding: { ...box.padding },
        layoutMode: box.layoutMode,
        textContent: box.textContent,
        children: box.children.map((c) => this.serialize(c))
      };
    }
  };
  return __toCommonJS(bundle_exports);
})();
