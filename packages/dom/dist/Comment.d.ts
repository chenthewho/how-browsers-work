/**
 * Comment 注释节点
 *
 * 对应 Chrome/Blink 中的 blink::Comment
 * 表示 HTML 注释 <!-- ... -->
 */
import { Node } from './Node';
import { NodeType } from '@browser/shared';
import type { INode, IComment } from '@browser/shared';
export declare class Comment extends Node implements IComment {
    readonly nodeType = NodeType.COMMENT_NODE;
    readonly nodeName = "#comment";
    constructor(data?: string);
    get data(): string;
    set data(value: string);
    cloneNode(deep?: boolean): INode;
}
//# sourceMappingURL=Comment.d.ts.map