/**
 * @browser/shared — 共享类型定义
 *
 * 所有其他模块都依赖这个包中的类型定义。
 * 包括 DOM 类型、CSS 类型、布局类型、IPC 消息类型、网络类型。
 */

// DOM 类型
export type {
  INode,
  IElement,
  IDocument,
  IText,
  IComment,
  IDOMTokenList,
  ICSSStyleDeclaration,
  IComputedStyle,
  IEvent,
} from './types/dom';
export { NodeType } from './types/dom';

// CSS 类型
export type {
  StyleSheet,
  StyleRule,
  CSSDeclaration,
  ComplexSelector,
  CompoundSelector,
  Combinator,
  AttributeSelector,
  PseudoClass,
  SpecificityTuple,
  CSSValue,
  LengthUnit,
} from './types/css';
export { StyleOrigin } from './types/css';

// 布局类型
export type {
  LayoutBox,
  LineBox,
  InlineFragment,
  EdgeSizes,
  Rect,
  SerializedLayoutBox,
} from './types/layout';
export { LayoutMode } from './types/layout';

// IPC 类型
export type {
  IPCMessage,
  NavigateMessage,
  LoadHTMLMessage,
  FetchResponseMessage,
  ExecuteScriptMessage,
  FetchRequestMessage,
  LayoutCompleteMessage,
  ConsoleLogMessage,
  ScriptErrorMessage,
  ReadyMessage,
} from './types/ipc';

// 网络类型
export type {
  HttpRequest,
  HttpResponse,
  Resource,
  FetchOptions,
} from './types/network';
