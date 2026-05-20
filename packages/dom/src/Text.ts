/**
 * Text 节点
 *
 * 对应 Chrome/Blink 中的 blink::Text
 * 文本节点是 DOM 树的叶子节点，包含实际的文字内容。
 *
 * Chrome 中 Text 继承自 CharacterData，CharacterData 提供 data 和 length 属性。
 */

import { Node } from './Node';
import { NodeType } from '@browser/shared';
import type { INode, IText } from '@browser/shared';

export class Text extends Node implements IText {
  readonly nodeType = NodeType.TEXT_NODE;
  readonly nodeName = '#text';

  constructor(data: string = '') {
    super();
    this.nodeValue = data;
  }

  get data(): string {
    return this.nodeValue || '';
  }

  set data(value: string) {
    this.nodeValue = value;
  }

  get length(): number {
    return this.data.length;
  }

  cloneNode(deep?: boolean): INode {
    // 文本节点是叶子节点，deep 参数不影响
    const cloned = new Text(this.data);
    cloned.ownerDocument = this.ownerDocument;
    return cloned;
  }
}
