"use strict";
/**
 * Comment 注释节点
 *
 * 对应 Chrome/Blink 中的 blink::Comment
 * 表示 HTML 注释 <!-- ... -->
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
const Node_1 = require("./Node");
const shared_1 = require("@browser/shared");
class Comment extends Node_1.Node {
    nodeType = shared_1.NodeType.COMMENT_NODE;
    nodeName = '#comment';
    constructor(data = '') {
        super();
        this.nodeValue = data;
    }
    get data() {
        return this.nodeValue || '';
    }
    set data(value) {
        this.nodeValue = value;
    }
    cloneNode(deep) {
        const cloned = new Comment(this.data);
        cloned.ownerDocument = this.ownerDocument;
        return cloned;
    }
}
exports.Comment = Comment;
//# sourceMappingURL=Comment.js.map