/**
 * HTML 树构造器（Tree Builder）
 *
 * 对应 Chrome/Blink 中的 HTMLTreeBuilder / HTMLConstructionSite
 *
 * 树构造器消费词法分析器产生的 token 流，通过"插入模式"状态机
 * 将 token 转换为 DOM 树操作（创建元素、插入节点、设置属性等）。
 *
 * 核心数据结构：
 *   1. 开放元素栈（Stack of Open Elements）—— 跟踪当前未闭合的元素
 *   2. 插入模式（Insertion Mode）—— 控制如何解析不同的 token
 *   3. 活跃格式化元素列表（Active Formatting Elements）
 *
 * Chrome 的树构造器实现了完整的 HTML5 规范（约 20 个插入模式），
 * 这里实现了其中最核心的约 8 个模式。
 */
import type { IDocument } from '@browser/shared';
import type { HTMLToken } from './Token';
export declare class HTMLTreeBuilder {
    /** 目标 Document */
    private document;
    /**
     * 开放元素栈 —— 对应 HTML spec 的 "stack of open elements"
     *
     * 这是树构造器最重要的数据结构。
     * 栈中的元素代表当前未闭合的元素。
     * 栈底是 <html>，栈顶是最近打开的元素。
     * 新元素被创建时 push，遇到结束标签时 pop。
     */
    private openElements;
    /**
     * 插入模式 —— 控制 token 的解析方式
     */
    private insertionMode;
    /**
     * 当前节点指针 —— 新节点被插入到这个节点的子节点中
     * 通常是 openElements 的栈顶元素
     */
    private currentNode;
    /**
     * 原始插入模式 —— 用于从 TABLE 模式恢复
     * 当进入 TABLE 相关模式时，保存之前的插入模式
     */
    private originalInsertionMode;
    /**
     * 用于跟踪需要 foster parenting（领养）的元素
     */
    private fosterParenting;
    constructor(document?: IDocument);
    /**
     * 处理 token 流，构建 DOM 树
     */
    build(tokens: HTMLToken[]): IDocument;
    private processToken;
    private processDOCTYPE;
    private processStartTag;
    private handleStartTagBeforeHTML;
    private handleStartTagBeforeHead;
    private handleStartTagInHead;
    private handleStartTagAfterHead;
    private handleStartTagInBody;
    private handleStartTagInTable;
    private handleStartTagInTableBody;
    private handleStartTagInRow;
    private handleStartTagInCell;
    private processEndTag;
    /**
     * IN_BODY 模式下的结束标签处理
     *
     * 结束标签的处理规则：
     *   - 在开放元素栈中查找匹配的标签
     *   - 弹出途中经过的所有不在特殊元素列表中的元素
     *   - 特殊元素不会被子元素的结束标签自动关闭
     */
    private handleEndTagInBody;
    private processCharacter;
    /**
     * 创建元素，设置属性，插入到当前节点的子节点列表中
     * 对应 Blink 的 HTMLConstructionSite::insertElement
     */
    private insertElement;
    /**
     * 创建元素，设置属性，插入，并 push 到开放元素栈
     */
    private insertElementAndPush;
    /**
     * 隐式创建元素（如 table 内部缺失的 tbody）
     */
    private createImpliedElement;
    /**
     * 从开放元素栈弹出指定元素
     */
    private popElement;
    /**
     * 弹出直到（包括）指定元素
     */
    private popElementUntil;
    /**
     * 关闭当前打开的 p 元素
     * p 元素是特殊的：遇到 <p>、</p> 或其他块级元素时会自动关闭
     */
    private closePElement;
    /**
     * 关闭当前打开的 li 元素
     */
    private closeLIElement;
    /**
     * 检查开放元素栈中是否有指定标签
     */
    private hasElementInStack;
    /**
     * 清除堆栈直到 table 上下文
     */
    private clearStackToTableContext;
    /**
     * 清除堆栈直到 table body 上下文
     */
    private clearStackToTableBodyContext;
    /**
     * 清除堆栈直到 table row 上下文
     */
    private clearStackToTableRowContext;
    /**
     * 在 table 上下文中处理不属于 table 的 token
     * 触发 foster parenting（领养机制）
     */
    private handleTokenInTableWithFosterParenting;
    /**
     * 恢复之前的插入模式
     */
    private resetInsertionMode;
    /**
     * 获取最后插入的元素
     */
    private _lastInserted;
}
//# sourceMappingURL=TreeBuilder.d.ts.map