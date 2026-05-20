/**
 * Comment 注释节点
 *
 * 对应 Chrome/Blink 中的 blink::Comment
 * 表示 HTML 注释 <!-- ... -->
 */

import { Node } from './Node';
import { NodeType } from '@browser/shared';
import type { INode, IComment } from '@browser/shared';

export class Comment extends Node implements IComment {
  readonly nodeType = NodeType.COMMENT_NODE;
  readonly nodeName = '#comment';

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

  cloneNode(deep?: boolean): INode {
    const cloned = new Comment(this.data);
    cloned.ownerDocument = this.ownerDocument;
    return cloned;
  }
}
