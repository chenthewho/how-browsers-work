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
export declare class Text extends Node implements IText {
    readonly nodeType = NodeType.TEXT_NODE;
    readonly nodeName = "#text";
    constructor(data?: string);
    get data(): string;
    set data(value: string);
    get length(): number;
    cloneNode(deep?: boolean): INode;
}
//# sourceMappingURL=Text.d.ts.map