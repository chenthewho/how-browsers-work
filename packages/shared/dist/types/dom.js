"use strict";
/**
 * DOM 类型定义
 *
 * 对应 Chrome/Blink 中的 third_party/blink/renderer/core/dom/
 * 这里定义了 DOM 树中所有节点的接口，仿照 Blink 的 Node/Element 继承体系
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeType = void 0;
// ============================================================
// Node 类型常量 —— 对应 DOM 规范中的 nodeType
// ============================================================
var NodeType;
(function (NodeType) {
    NodeType[NodeType["ELEMENT_NODE"] = 1] = "ELEMENT_NODE";
    NodeType[NodeType["TEXT_NODE"] = 3] = "TEXT_NODE";
    NodeType[NodeType["COMMENT_NODE"] = 8] = "COMMENT_NODE";
    NodeType[NodeType["DOCUMENT_NODE"] = 9] = "DOCUMENT_NODE";
    NodeType[NodeType["DOCUMENT_FRAGMENT_NODE"] = 11] = "DOCUMENT_FRAGMENT_NODE";
})(NodeType || (exports.NodeType = NodeType = {}));
//# sourceMappingURL=dom.js.map