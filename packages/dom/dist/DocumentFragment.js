"use strict";
/**
 * DocumentFragment — 轻量级的文档片段
 *
 * 对应 Chrome/Blink 中的 blink::DocumentFragment
 * 用于批量操作 DOM 而不引起多次重排。
 * 当 fragment 被 appendChild 到其他节点时，其所有子节点会直接插入，
 * fragment 本身不会出现在 DOM 树中。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentFragment = void 0;
const Node_1 = require("./Node");
const shared_1 = require("@browser/shared");
class DocumentFragment extends Node_1.Node {
    nodeType = shared_1.NodeType.DOCUMENT_FRAGMENT_NODE;
    nodeName = '#document-fragment';
    /**
     * 当 fragment 被插入到 DOM 树时，它的所有子节点会直接迁移到父节点。
     * 这是 DOM 规范中 DocumentFragment 的关键行为。
     */
    appendChild(child) {
        return super.appendChild(child);
    }
    cloneNode(deep) {
        const fragment = new DocumentFragment();
        fragment.ownerDocument = this.ownerDocument;
        if (deep) {
            let child = this.firstChild;
            while (child) {
                fragment.appendChild(child.cloneNode(true));
                child = child.nextSibling;
            }
        }
        return fragment;
    }
}
exports.DocumentFragment = DocumentFragment;
//# sourceMappingURL=DocumentFragment.js.map