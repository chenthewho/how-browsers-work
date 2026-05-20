/**
 * DocumentFragment — 轻量级的文档片段
 *
 * 对应 Chrome/Blink 中的 blink::DocumentFragment
 * 用于批量操作 DOM 而不引起多次重排。
 * 当 fragment 被 appendChild 到其他节点时，其所有子节点会直接插入，
 * fragment 本身不会出现在 DOM 树中。
 */

import { Node } from './Node';
import { NodeType } from '@browser/shared';
import type { INode } from '@browser/shared';

export class DocumentFragment extends Node {
  readonly nodeType = NodeType.DOCUMENT_FRAGMENT_NODE;
  readonly nodeName = '#document-fragment';

  /**
   * 当 fragment 被插入到 DOM 树时，它的所有子节点会直接迁移到父节点。
   * 这是 DOM 规范中 DocumentFragment 的关键行为。
   */
  appendChild(child: INode): INode {
    return super.appendChild(child);
  }

  cloneNode(deep?: boolean): INode {
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
