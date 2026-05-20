"use strict";
/**
 * HTML 树构造器（Tree Builder）
 *
 * 对应 Chrome/Blink 中的 HTMLTreeBuilder / HTMLConstructionSite
 *
 * 树构造器消费词法分析器产生的 token 流，通过"插入模式"状态机
 * 将 token 转换为 DOM 树操作（创建元素、插入节点、设置属性等）。
 *
 * 核心数据结构：
 *   1. 开放元素栈（Stack of Open Elements）—— 跟踪当前未闭合的元素
 *   2. 插入模式（Insertion Mode）—— 控制如何解析不同的 token
 *   3. 活跃格式化元素列表（Active Formatting Elements）
 *
 * Chrome 的树构造器实现了完整的 HTML5 规范（约 20 个插入模式），
 * 这里实现了其中最核心的约 8 个模式。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLTreeBuilder = void 0;
const shared_1 = require("@browser/shared");
const dom_1 = require("@browser/dom");
const Token_1 = require("./Token");
// ============================================================
// 插入模式枚举
// ============================================================
var InsertionMode;
(function (InsertionMode) {
    InsertionMode["INITIAL"] = "INITIAL";
    InsertionMode["BEFORE_HTML"] = "BEFORE_HTML";
    InsertionMode["BEFORE_HEAD"] = "BEFORE_HEAD";
    InsertionMode["IN_HEAD"] = "IN_HEAD";
    InsertionMode["AFTER_HEAD"] = "AFTER_HEAD";
    InsertionMode["IN_BODY"] = "IN_BODY";
    InsertionMode["IN_TABLE"] = "IN_TABLE";
    InsertionMode["IN_TABLE_BODY"] = "IN_TABLE_BODY";
    InsertionMode["IN_ROW"] = "IN_ROW";
    InsertionMode["IN_CELL"] = "IN_CELL";
    InsertionMode["TEXT"] = "TEXT";
})(InsertionMode || (InsertionMode = {}));
/**
 * Void elements —— 自闭合元素，不能有子节点
 * HTML 规范定义的 void elements 列表
 */
const VOID_ELEMENTS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr',
]);
/**
 * 特殊元素 —— 它们的关闭规则与普通元素不同
 */
const SPECIAL_ELEMENTS = new Set([
    'address', 'applet', 'area', 'article', 'aside', 'base',
    'basefont', 'bgsound', 'blockquote', 'body', 'br', 'button',
    'caption', 'center', 'col', 'colgroup', 'dd', 'details', 'dir',
    'div', 'dl', 'dt', 'embed', 'fieldset', 'figcaption', 'figure',
    'footer', 'form', 'frame', 'frameset', 'h1', 'h2', 'h3', 'h4',
    'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'iframe',
    'img', 'input', 'li', 'link', 'listing', 'main', 'marquee',
    'meta', 'nav', 'noembed', 'noframes', 'noscript', 'object',
    'ol', 'p', 'param', 'plaintext', 'pre', 'script', 'section',
    'select', 'source', 'style', 'summary', 'table', 'tbody', 'td',
    'template', 'textarea', 'tfoot', 'th', 'thead', 'title', 'tr',
    'track', 'ul', 'wbr', 'xmp',
]);
class HTMLTreeBuilder {
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
    insertionMode = InsertionMode.INITIAL;
    /**
     * 当前节点指针 —— 新节点被插入到这个节点的子节点中
     * 通常是 openElements 的栈顶元素
     */
    currentNode;
    /**
     * 原始插入模式 —— 用于从 TABLE 模式恢复
     * 当进入 TABLE 相关模式时，保存之前的插入模式
     */
    originalInsertionMode = InsertionMode.INITIAL;
    /**
     * 用于跟踪需要 foster parenting（领养）的元素
     */
    fosterParenting = false;
    constructor(document) {
        this.document = document || new dom_1.Document();
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
            case Token_1.TokenType.DOCTYPE:
                this.processDOCTYPE(token);
                break;
            case Token_1.TokenType.START_TAG:
                this.processStartTag(token);
                break;
            case Token_1.TokenType.END_TAG:
                this.processEndTag(token);
                break;
            case Token_1.TokenType.CHARACTER:
                this.processCharacter(token);
                break;
            case Token_1.TokenType.COMMENT:
                // 注释：在当前节点下插入注释节点（简化处理）
                if (this.currentNode.nodeType !== shared_1.NodeType.DOCUMENT_NODE) {
                    const comment = this.document.createComment(token.data);
                    this.currentNode.appendChild(comment);
                }
                break;
            case Token_1.TokenType.END_OF_FILE:
                // 解析结束
                break;
        }
    }
    // ============================================================
    // DOCTYPE 处理
    // ============================================================
    processDOCTYPE(token) {
        // 在 Chrome 中，DOCTYPE 会影响渲染模式（quirks / limited quirks / no quirks）
        // 我们简化处理：始终使用标准模式
        this.insertionMode = InsertionMode.BEFORE_HTML;
    }
    // ============================================================
    // 开始标签处理
    // ============================================================
    processStartTag(token) {
        const tagName = token.tagName;
        switch (this.insertionMode) {
            case InsertionMode.INITIAL:
            case InsertionMode.BEFORE_HTML:
                return this.handleStartTagBeforeHTML(token);
            case InsertionMode.BEFORE_HEAD:
                return this.handleStartTagBeforeHead(token);
            case InsertionMode.IN_HEAD:
                return this.handleStartTagInHead(token);
            case InsertionMode.AFTER_HEAD:
                return this.handleStartTagAfterHead(token);
            case InsertionMode.IN_BODY:
                return this.handleStartTagInBody(token);
            case InsertionMode.IN_TABLE:
                return this.handleStartTagInTable(token);
            case InsertionMode.IN_TABLE_BODY:
                return this.handleStartTagInTableBody(token);
            case InsertionMode.IN_ROW:
                return this.handleStartTagInRow(token);
            case InsertionMode.IN_CELL:
                return this.handleStartTagInCell(token);
            case InsertionMode.TEXT:
                // 在 TEXT 模式下不应出现 start tag
                break;
        }
    }
    // ============================================================
    // BEFORE_HTML 模式
    // ============================================================
    handleStartTagBeforeHTML(token) {
        if (token.tagName === 'html') {
            const element = this.insertElement(token);
            this.openElements.push(element);
            this.currentNode = element;
            this.insertionMode = InsertionMode.BEFORE_HEAD;
        }
        else {
            // 隐式创建 html 元素
            const htmlEl = this.document.createElement('html');
            this.document.appendChild(htmlEl);
            this.openElements.push(htmlEl);
            this.currentNode = htmlEl;
            this.insertionMode = InsertionMode.BEFORE_HEAD;
            // 重新处理当前 token
            this.processStartTag(token);
        }
    }
    // ============================================================
    // BEFORE_HEAD 模式
    // ============================================================
    handleStartTagBeforeHead(token) {
        if (token.tagName === 'html') {
            // 已经被处理过了，忽略
            return;
        }
        else if (token.tagName === 'head') {
            const element = this.insertElement(token);
            this.openElements.push(element);
            this.currentNode = element;
            this.insertionMode = InsertionMode.IN_HEAD;
        }
        else {
            // 先创建 head
            const head = this.document.createElement('head');
            this.currentNode.appendChild(head);
            this.openElements.push(head);
            this.currentNode = head;
            this.insertionMode = InsertionMode.IN_HEAD;
            // 重新处理
            this.processStartTag(token);
        }
    }
    // ============================================================
    // IN_HEAD 模式
    // ============================================================
    handleStartTagInHead(token) {
        const tagName = token.tagName;
        if (tagName === 'html') {
            this.handleStartTagBeforeHTML(token);
        }
        else if (tagName === 'base' || tagName === 'link' || tagName === 'meta') {
            // 自闭合，不 push 进堆栈
            const el = this.insertElement(token);
            this.openElements.pop();
        }
        else if (tagName === 'title' || tagName === 'style' || tagName === 'script') {
            // <title>/<style>/<script> 触发 TEXT 模式
            // 保存当前的插入模式，以便结束后恢复
            this.originalInsertionMode = this.insertionMode;
            this.insertElement(token);
            this.openElements.push(this._lastInserted());
            this.insertionMode = InsertionMode.TEXT;
        }
        else if (tagName === 'noscript') {
            this.insertElement(token);
            this.openElements.push(this._lastInserted());
        }
        else if (tagName === 'head') {
            // 重复的 head 标签，忽略
            return;
        }
        else {
            // 结束 head，回到 body
            this.popElement('head');
            this.insertionMode = InsertionMode.AFTER_HEAD;
            this.processStartTag(token);
        }
    }
    // ============================================================
    // AFTER_HEAD 模式
    // ============================================================
    handleStartTagAfterHead(token) {
        const tagName = token.tagName;
        if (tagName === 'html' || tagName === 'head') {
            // 错误处理
        }
        else if (tagName === 'body') {
            const element = this.insertElement(token);
            this.openElements.push(element);
            this.currentNode = element;
            this.insertionMode = InsertionMode.IN_BODY;
        }
        else if (tagName === 'frameset') {
            // frameset 选择（简化，直接当作 body 处理）
            const element = this.insertElement(token);
            this.openElements.push(element);
            this.currentNode = element;
            this.insertionMode = InsertionMode.IN_BODY;
        }
        else {
            // 隐式创建 body
            const body = this.document.createElement('body');
            this.currentNode.appendChild(body);
            this.openElements.push(body);
            this.currentNode = body;
            this.insertionMode = InsertionMode.IN_BODY;
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
        // --- 标题元素 (h1-h6) ---
        // 遇到新的标题标签时，隐式关闭之前的标题
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
            // 关闭任何已打开的标题
            const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
            for (let i = this.openElements.length - 1; i >= 0; i--) {
                if (headingTags.includes(this.openElements[i].tagName.toLowerCase())) {
                    this.popElementUntil(this.openElements[i].tagName);
                    break;
                }
            }
            this.insertElementAndPush(token);
            return;
        }
        // --- 段落元素 (p) ---
        if (tagName === 'p') {
            // p 元素不能嵌套，遇到 <p> 时隐式关闭之前的 <p>
            this.closePElement();
            this.insertElementAndPush(token);
            return;
        }
        // --- 列表项 (li) ---
        if (tagName === 'li') {
            this.closeLIElement();
            this.insertElementAndPush(token);
            return;
        }
        // --- 表格相关 ---
        if (tagName === 'table') {
            this.closePElement();
            const element = this.insertElement(token);
            this.openElements.push(element);
            this.currentNode = element;
            this.insertionMode = InsertionMode.IN_TABLE;
            return;
        }
        if (tagName === 'tr') {
            this.closePElement();
            // 隐式创建 tbody
            this.createImpliedElement('tbody');
            const element = this.insertElement(token);
            this.openElements.push(element);
            this.currentNode = element;
            this.insertionMode = InsertionMode.IN_ROW;
            return;
        }
        if (tagName === 'td' || tagName === 'th') {
            this.createImpliedElement('tr');
            const element = this.insertElement(token);
            this.openElements.push(element);
            this.currentNode = element;
            this.insertionMode = InsertionMode.IN_CELL;
            return;
        }
        if (tagName === 'thead' || tagName === 'tbody' || tagName === 'tfoot') {
            this.closePElement();
            const element = this.insertElement(token);
            this.openElements.push(element);
            this.currentNode = element;
            this.insertionMode = InsertionMode.IN_TABLE_BODY;
            return;
        }
        // --- br, hr, img 等 void elements ---
        if (VOID_ELEMENTS.has(tagName)) {
            this.closePElement();
            const element = this.insertElement(token);
            // void elements 没有内容，不 push 到 openElements
            return;
        }
        // --- div, section, article 等块级元素 ---
        // Chrome 中，块级元素会自动关闭当前打开的 p 元素
        if (['div', 'section', 'article', 'aside', 'nav', 'header', 'footer',
            'main', 'figure', 'figcaption', 'blockquote', 'details', 'dialog',
            'fieldset', 'form', 'center', 'address'].includes(tagName)) {
            this.closePElement();
        }
        // --- 默认处理：插入元素并压入堆栈 ---
        this.insertElementAndPush(token);
    }
    // ============================================================
    // IN_TABLE 模式
    // ============================================================
    handleStartTagInTable(token) {
        const tagName = token.tagName;
        if (tagName === 'caption') {
            this.clearStackToTableContext();
            this.openElements.push(this.insertElement(token));
            this.insertionMode = InsertionMode.IN_TABLE;
        }
        else if (tagName === 'colgroup' || tagName === 'col') {
            this.clearStackToTableContext();
            this.insertElement(token);
            // col/colgroup 是自闭合的
        }
        else if (tagName === 'thead' || tagName === 'tbody' || tagName === 'tfoot') {
            this.clearStackToTableContext();
            const el = this.insertElement(token);
            this.openElements.push(el);
            this.currentNode = el;
            this.insertionMode = InsertionMode.IN_TABLE_BODY;
        }
        else if (tagName === 'tr') {
            this.clearStackToTableContext();
            // 隐式创建 tbody
            this.createImpliedElement('tbody');
            const el = this.insertElement(token);
            this.openElements.push(el);
            this.currentNode = el;
            this.insertionMode = InsertionMode.IN_ROW;
        }
        else if (tagName === 'td' || tagName === 'th') {
            this.clearStackToTableContext();
            this.createImpliedElement('tbody');
            this.createImpliedElement('tr');
            const el = this.insertElement(token);
            this.openElements.push(el);
            this.currentNode = el;
            this.insertionMode = InsertionMode.IN_CELL;
        }
        else {
            // 表中不应出现的标签，触发 foster parenting
            this.handleTokenInTableWithFosterParenting(token);
        }
    }
    // ============================================================
    // IN_TABLE_BODY 模式
    // ============================================================
    handleStartTagInTableBody(token) {
        if (token.tagName === 'tr') {
            this.clearStackToTableBodyContext();
            const el = this.insertElement(token);
            this.openElements.push(el);
            this.currentNode = el;
            this.insertionMode = InsertionMode.IN_ROW;
        }
        else if (token.tagName === 'td' || token.tagName === 'th') {
            this.clearStackToTableBodyContext();
            this.createImpliedElement('tr');
            const el = this.insertElement(token);
            this.openElements.push(el);
            this.currentNode = el;
            this.insertionMode = InsertionMode.IN_CELL;
        }
        else {
            this.handleTokenInTableWithFosterParenting(token);
        }
    }
    // ============================================================
    // IN_ROW 模式
    // ============================================================
    handleStartTagInRow(token) {
        if (token.tagName === 'td' || token.tagName === 'th') {
            this.clearStackToTableRowContext();
            const el = this.insertElement(token);
            this.openElements.push(el);
            this.currentNode = el;
            this.insertionMode = InsertionMode.IN_CELL;
        }
        else {
            this.handleTokenInTableWithFosterParenting(token);
        }
    }
    // ============================================================
    // IN_CELL 模式
    // ============================================================
    handleStartTagInCell(token) {
        // 在 td/th 内部的元素
        this.insertElementAndPush(token);
    }
    // ============================================================
    // 结束标签处理
    // ============================================================
    processEndTag(token) {
        const tagName = token.tagName;
        switch (this.insertionMode) {
            case InsertionMode.INITIAL:
            case InsertionMode.BEFORE_HTML:
            case InsertionMode.BEFORE_HEAD:
                // 这些模式下不应有结束标签
                break;
            case InsertionMode.IN_HEAD:
                if (tagName === 'head') {
                    this.popElement('head');
                    this.insertionMode = InsertionMode.AFTER_HEAD;
                }
                break;
            case InsertionMode.AFTER_HEAD:
                if (tagName === 'body' || tagName === 'html') {
                    // 忽略
                }
                break;
            case InsertionMode.IN_BODY:
                this.handleEndTagInBody(tagName);
                break;
            case InsertionMode.IN_TABLE:
                if (tagName === 'table') {
                    this.popElement('table');
                    this.resetInsertionMode();
                }
                break;
            case InsertionMode.IN_TABLE_BODY:
                if (tagName === 'tbody' || tagName === 'thead' || tagName === 'tfoot') {
                    this.popElement(tagName);
                    this.insertionMode = InsertionMode.IN_TABLE;
                }
                else if (tagName === 'table') {
                    this.popElement('table');
                    this.resetInsertionMode();
                }
                break;
            case InsertionMode.IN_ROW:
                if (tagName === 'tr') {
                    this.popElement('tr');
                    this.insertionMode = InsertionMode.IN_TABLE_BODY;
                }
                else if (tagName === 'table') {
                    this.popElement('tr');
                    this.insertionMode = InsertionMode.IN_TABLE_BODY;
                    this.processEndTag(token);
                }
                break;
            case InsertionMode.IN_CELL:
                if (tagName === 'td' || tagName === 'th') {
                    this.popElement(tagName);
                    this.insertionMode = InsertionMode.IN_ROW;
                }
                break;
            case InsertionMode.TEXT:
                // 在 TEXT 模式下收到结束标签，关闭对应的元素并恢复之前的模式
                if (tagName === 'title' || tagName === 'style' || tagName === 'script' || tagName === 'textarea') {
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
        // 特殊元素列表中的元素需要通过显式的结束标签关闭
        if (tagName === 'body') {
            // 回到 AFTER_BODY 状态
            this.insertionMode = InsertionMode.AFTER_HEAD;
            return;
        }
        if (tagName === 'html') {
            return;
        }
        // 在开放元素栈中查找匹配的元素
        if (this.hasElementInStack(tagName)) {
            // p 元素的特殊关闭规则
            if (tagName === 'p') {
                this.closePElement();
                return;
            }
            // li 元素的关闭规则
            if (tagName === 'li') {
                this.closeLIElement();
                return;
            }
            // 弹出直到匹配的元素
            this.popElementUntil(tagName);
        }
    }
    // ============================================================
    // 字符处理
    // ============================================================
    processCharacter(token) {
        // 空白字符折叠（简化处理，Chrome 中有更精细的空白处理）
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
        // 设置属性
        for (const attr of token.attributes) {
            element.setAttribute(attr.name, attr.value);
        }
        // 插入到当前位置
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
                // 更新当前节点为栈顶
                this.currentNode = this.openElements.length > 0
                    ? this.openElements[this.openElements.length - 1]
                    : this.document;
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
            // 如果当前元素不是特殊元素，弹出它
            if (!SPECIAL_ELEMENTS.has(this.openElements[i].tagName.toLowerCase())) {
                this.openElements.splice(i, 1);
            }
        }
        this.currentNode = this.openElements.length > 0
            ? this.openElements[this.openElements.length - 1]
            : this.document.documentElement || this.document;
    }
    /**
     * 关闭当前打开的 p 元素
     * p 元素是特殊的：遇到 <p>、</p> 或其他块级元素时会自动关闭
     */
    closePElement() {
        this.popElementUntil('p');
    }
    /**
     * 关闭当前打开的 li 元素
     */
    closeLIElement() {
        this.popElementUntil('li');
    }
    /**
     * 检查开放元素栈中是否有指定标签
     */
    hasElementInStack(tagName) {
        return this.openElements.some(el => el.tagName.toLowerCase() === tagName);
    }
    /**
     * 清除堆栈直到 table 上下文
     */
    clearStackToTableContext() {
        while (this.openElements.length > 0 &&
            this.openElements[this.openElements.length - 1].tagName.toLowerCase() !== 'table') {
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
            if (tagName === 'tbody' || tagName === 'thead' || tagName === 'tfoot' || tagName === 'table') {
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
            if (tagName === 'tr' || tagName === 'table') {
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
        // 简化处理：将元素插入到 table 之前的位置
        // 完整的 foster parenting 需要找到合适的插入点
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
        return this.openElements.length > 0
            ? this.openElements[this.openElements.length - 1]
            : null;
    }
}
exports.HTMLTreeBuilder = HTMLTreeBuilder;
//# sourceMappingURL=TreeBuilder.js.map