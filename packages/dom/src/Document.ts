/**
 * Document — DOM 树的根节点
 *
 * 对应 Chrome/Blink 中的 blink::Document
 * Document 是 DOM 树的根节点，它不直接对应任何 HTML 元素。
 * 但它是所有节点的 ownerDocument。
 *
 * Chrome 中 Document 的作用：
 *   1. 节点工厂 — createElement, createTextNode 等
 *   2. 树根 — 拥有 documentElement（<html>）
 *   3. 查询入口 — getElementById
 */

import { Node } from './Node';
import { Element } from './Element';
import { Text } from './Text';
import { Comment } from './Comment';
import { NodeType } from '@browser/shared';
import type { INode, IDocument, IElement, IText, IComment } from '@browser/shared';

export class Document extends Node implements IDocument {
  readonly nodeType = NodeType.DOCUMENT_NODE;
  readonly nodeName = '#document';

  // ============================================================
  // 便利访问器 — 对应 Blink 的 Document::documentElement() 等
  // ============================================================

  /**
   * documentElement — 返回 <html> 元素
   */
  get documentElement(): IElement | null {
    let child = this.firstChild;
    while (child) {
      if (
        child.nodeType === NodeType.ELEMENT_NODE &&
        (child as IElement).tagName === 'HTML'
      ) {
        return child as IElement;
      }
      child = child.nextSibling;
    }
    return null;
  }

  /**
   * head — 返回 <head> 元素
   */
  get head(): IElement | null {
    const html = this.documentElement;
    if (!html) return null;

    let child = html.firstChild;
    while (child) {
      if (
        child.nodeType === NodeType.ELEMENT_NODE &&
        (child as IElement).tagName === 'HEAD'
      ) {
        return child as IElement;
      }
      child = child.nextSibling;
    }
    return null;
  }

  /**
   * body — 返回 <body> 元素
   */
  get body(): IElement | null {
    const html = this.documentElement;
    if (!html) return null;

    let child = html.firstChild;
    while (child) {
      if (
        child.nodeType === NodeType.ELEMENT_NODE &&
        (child as IElement).tagName === 'BODY'
      ) {
        return child as IElement;
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

  createElement(tagName: string): IElement {
    // 根据标签名创建对应的 Element 子类
    const element = new Element(tagName);
    element.ownerDocument = this;
    return element;
  }

  createTextNode(data: string): IText {
    const text = new Text(data);
    text.ownerDocument = this;
    return text;
  }

  createComment(data: string): IComment {
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
  getElementById(id: string): IElement | null {
    return this._findById(this, id);
  }

  /**
   * 在子树中递归查找指定 id 的元素
   */
  private _findById(root: INode, id: string): IElement | null {
    let child = root.firstChild;
    while (child) {
      if (
        child.nodeType === NodeType.ELEMENT_NODE &&
        (child as IElement).id === id
      ) {
        return child as IElement;
      }
      // 递归搜索子节点
      const found = this._findById(child, id);
      if (found) return found;
      child = child.nextSibling;
    }
    return null;
  }

  // ============================================================
  // cloneNode — Document 本身通常不被克隆，但提供基本实现
  // ============================================================
  cloneNode(deep?: boolean): INode {
    const cloned = new Document();

    if (deep) {
      let child = this.firstChild;
      while (child) {
        cloned.appendChild(child.cloneNode(true));
        child = child.nextSibling;
      }
    }

    return cloned;
  }
}
