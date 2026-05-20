/**
 * HTML Token 类型定义
 *
 * 对应 Chrome/Blink 中的 HTMLToken
 * HTML 词法分析器将字符流转换为 token 流，树构造器消费 token 流构建 DOM 树。
 *
 * Chrome 的 HTMLTokenizer 产生五种 token 类型：
 *   - StartTag: <div id="main">
 *   - EndTag: </div>
 *   - Character: 普通文本字符
 *   - Comment: <!-- ... -->
 *   - DOCTYPE: <!DOCTYPE html>
 *   - EndOfFile: 流结束标记
 */

/**
 * Token 类型枚举
 */
export enum TokenType {
  START_TAG = 'StartTag',
  END_TAG = 'EndTag',
  CHARACTER = 'Character',
  COMMENT = 'Comment',
  DOCTYPE = 'DOCTYPE',
  END_OF_FILE = 'EndOfFile',
}

/**
 * 属性 token —— 标签的一个属性
 * 例如：id="main" 或 disabled
 */
export interface AttributeToken {
  name: string;          // 属性名（已转为小写）
  value: string;         // 属性值（空字符串表示无值属性，如 disabled）
}

/**
 * 开始标签 token
 * 例如：<div id="main" class="container">
 *   tagName = "div"
 *   attributes = [{name: "id", value: "main"}, {name: "class", value: "container"}]
 *   selfClosing = false
 */
export interface StartTagToken {
  type: TokenType.START_TAG;
  tagName: string;                   // 标签名（小写）
  attributes: AttributeToken[];      // 属性列表
  selfClosing: boolean;              // 是否自闭合（<br/> 或 <img/>）
  originalTagName: string;           // 原始标签名（保留大小写）
}

/**
 * 结束标签 token
 * 例如：</div>
 */
export interface EndTagToken {
  type: TokenType.END_TAG;
  tagName: string;
  attributes: AttributeToken[];      // 结束标签通常没有属性，但解析器会处理
}

/**
 * 字符 token
 * 表示标签之间的文本内容
 */
export interface CharacterToken {
  type: TokenType.CHARACTER;
  data: string;
}

/**
 * 注释 token
 * 例如：<!-- 这是一段注释 -->
 */
export interface CommentToken {
  type: TokenType.COMMENT;
  data: string;
}

/**
 * DOCTYPE token
 * 例如：<!DOCTYPE html>
 */
export interface DOCTYPEToken {
  type: TokenType.DOCTYPE;
  name: string | null;       // doctype 名称（如 "html"）
  publicId: string | null;   // PUBLIC 标识符
  systemId: string | null;   // SYSTEM 标识符
  forceQuirks: boolean;      // 是否需要 quirks 模式
}

/**
 * 文件结束 token
 */
export interface EndOfFileToken {
  type: TokenType.END_OF_FILE;
}

/**
 * 所有 token 类型的联合
 */
export type HTMLToken =
  | StartTagToken
  | EndTagToken
  | CharacterToken
  | CommentToken
  | DOCTYPEToken
  | EndOfFileToken;

// ============================================================
// 工厂函数 —— 创建各种 token
// ============================================================

export function createStartTagToken(tagName: string, originalTagName?: string): StartTagToken {
  return {
    type: TokenType.START_TAG,
    tagName: tagName.toLowerCase(),
    attributes: [],
    selfClosing: false,
    originalTagName: originalTagName || tagName,
  };
}

export function createEndTagToken(tagName: string): EndTagToken {
  return {
    type: TokenType.END_TAG,
    tagName: tagName.toLowerCase(),
    attributes: [],
  };
}

export function createCharacterToken(data: string = ''): CharacterToken {
  return { type: TokenType.CHARACTER, data };
}

export function createCommentToken(data: string = ''): CommentToken {
  return { type: TokenType.COMMENT, data };
}

export function createDOCTYPEToken(): DOCTYPEToken {
  return {
    type: TokenType.DOCTYPE,
    name: null,
    publicId: null,
    systemId: null,
    forceQuirks: false,
  };
}

export function createEndOfFileToken(): EndOfFileToken {
  return { type: TokenType.END_OF_FILE };
}
