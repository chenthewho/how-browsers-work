"use strict";
/**
 * Text 节点
 *
 * 对应 Chrome/Blink 中的 blink::Text
 * 文本节点是 DOM 树的叶子节点，包含实际的文字内容。
 *
 * Chrome 中 Text 继承自 CharacterData，CharacterData 提供 data 和 length 属性。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Text = void 0;
const Node_1 = require("./Node");
const shared_1 = require("@browser/shared");
class Text extends Node_1.Node {
    nodeType = shared_1.NodeType.TEXT_NODE;
    nodeName = '#text';
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
    get length() {
        return this.data.length;
    }
    cloneNode(deep) {
        // 文本节点是叶子节点，deep 参数不影响
        const cloned = new Text(this.data);
        cloned.ownerDocument = this.ownerDocument;
        return cloned;
    }
}
exports.Text = Text;
//# sourceMappingURL=Text.js.map