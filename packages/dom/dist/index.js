"use strict";
/**
 * @browser/dom — DOM 树实现
 *
 * 对应 Chrome/Blink 的 third_party/blink/renderer/core/dom/
 *
 * 提供：
 * - Node 基类（链表式树结构）
 * - Element 基类（属性管理、classList、查询方法）
 * - Document（DOM 树根节点、节点工厂）
 * - Text / Comment / DocumentFragment
 * - HTMLElement 子类（div, span, p 等）
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLAnchorElement = exports.HTMLImageElement = exports.HTMLLinkElement = exports.HTMLScriptElement = exports.HTMLStyleElement = exports.HTMLMetaElement = exports.HTMLTitleElement = exports.HTMLHtmlElement = exports.HTMLHeadElement = exports.HTMLBodyElement = exports.HTMLEmElement = exports.HTMLStrongElement = exports.HTMLHRElement = exports.HTMLBRElement = exports.HTMLTableSectionElement = exports.HTMLTableCellElement = exports.HTMLTableRowElement = exports.HTMLTableElement = exports.HTMLLIElement = exports.HTMLOListElement = exports.HTMLUListElement = exports.HTMLHeadingElement = exports.HTMLParagraphElement = exports.HTMLSpanElement = exports.HTMLDivElement = exports.createHTMLElement = exports.createCSSStyleDeclaration = exports.CSSStyleDeclaration = exports.DOMTokenList = exports.DocumentFragment = exports.Comment = exports.Text = exports.Document = exports.Element = exports.Node = void 0;
var Node_1 = require("./Node");
Object.defineProperty(exports, "Node", { enumerable: true, get: function () { return Node_1.Node; } });
var Element_1 = require("./Element");
Object.defineProperty(exports, "Element", { enumerable: true, get: function () { return Element_1.Element; } });
var Document_1 = require("./Document");
Object.defineProperty(exports, "Document", { enumerable: true, get: function () { return Document_1.Document; } });
var Text_1 = require("./Text");
Object.defineProperty(exports, "Text", { enumerable: true, get: function () { return Text_1.Text; } });
var Comment_1 = require("./Comment");
Object.defineProperty(exports, "Comment", { enumerable: true, get: function () { return Comment_1.Comment; } });
var DocumentFragment_1 = require("./DocumentFragment");
Object.defineProperty(exports, "DocumentFragment", { enumerable: true, get: function () { return DocumentFragment_1.DocumentFragment; } });
var DOMTokenList_1 = require("./DOMTokenList");
Object.defineProperty(exports, "DOMTokenList", { enumerable: true, get: function () { return DOMTokenList_1.DOMTokenList; } });
var CSSStyleDeclaration_1 = require("./CSSStyleDeclaration");
Object.defineProperty(exports, "CSSStyleDeclaration", { enumerable: true, get: function () { return CSSStyleDeclaration_1.CSSStyleDeclarationBase; } });
Object.defineProperty(exports, "createCSSStyleDeclaration", { enumerable: true, get: function () { return CSSStyleDeclaration_1.createCSSStyleDeclaration; } });
var HTMLElements_1 = require("./HTMLElements");
Object.defineProperty(exports, "createHTMLElement", { enumerable: true, get: function () { return HTMLElements_1.createHTMLElement; } });
var HTMLElements_2 = require("./HTMLElements");
Object.defineProperty(exports, "HTMLDivElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLDivElement; } });
Object.defineProperty(exports, "HTMLSpanElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLSpanElement; } });
Object.defineProperty(exports, "HTMLParagraphElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLParagraphElement; } });
Object.defineProperty(exports, "HTMLHeadingElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLHeadingElement; } });
Object.defineProperty(exports, "HTMLUListElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLUListElement; } });
Object.defineProperty(exports, "HTMLOListElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLOListElement; } });
Object.defineProperty(exports, "HTMLLIElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLLIElement; } });
Object.defineProperty(exports, "HTMLTableElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLTableElement; } });
Object.defineProperty(exports, "HTMLTableRowElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLTableRowElement; } });
Object.defineProperty(exports, "HTMLTableCellElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLTableCellElement; } });
Object.defineProperty(exports, "HTMLTableSectionElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLTableSectionElement; } });
Object.defineProperty(exports, "HTMLBRElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLBRElement; } });
Object.defineProperty(exports, "HTMLHRElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLHRElement; } });
Object.defineProperty(exports, "HTMLStrongElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLStrongElement; } });
Object.defineProperty(exports, "HTMLEmElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLEmElement; } });
Object.defineProperty(exports, "HTMLBodyElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLBodyElement; } });
Object.defineProperty(exports, "HTMLHeadElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLHeadElement; } });
Object.defineProperty(exports, "HTMLHtmlElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLHtmlElement; } });
Object.defineProperty(exports, "HTMLTitleElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLTitleElement; } });
Object.defineProperty(exports, "HTMLMetaElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLMetaElement; } });
Object.defineProperty(exports, "HTMLStyleElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLStyleElement; } });
Object.defineProperty(exports, "HTMLScriptElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLScriptElement; } });
Object.defineProperty(exports, "HTMLLinkElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLLinkElement; } });
Object.defineProperty(exports, "HTMLImageElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLImageElement; } });
Object.defineProperty(exports, "HTMLAnchorElement", { enumerable: true, get: function () { return HTMLElements_2.HTMLAnchorElement; } });
//# sourceMappingURL=index.js.map