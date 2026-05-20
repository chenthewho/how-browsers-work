"use strict";
/**
 * @browser/html-parser — HTML 解析器
 *
 * 对应 Chrome/Blink 的 third_party/blink/renderer/core/html/parser/
 *
 * 将 HTML 字符串解析为 DOM 树。
 * 实现了 HTML5 规范的词法分析和树构造两个阶段。
 *
 * 主要导出：
 *   - HTMLParser：解析器入口
 *   - HTMLTokenizer：词法分析器（状态机）
 *   - HTMLTreeBuilder：树构造器（插入模式）
 *   - Token 类型：词法分析产生的 token 类型
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenType = exports.HTMLTreeBuilder = exports.HTMLTokenizer = exports.HTMLParser = void 0;
var Parser_1 = require("./Parser");
Object.defineProperty(exports, "HTMLParser", { enumerable: true, get: function () { return Parser_1.HTMLParser; } });
var Tokenizer_1 = require("./Tokenizer");
Object.defineProperty(exports, "HTMLTokenizer", { enumerable: true, get: function () { return Tokenizer_1.HTMLTokenizer; } });
var TreeBuilder_1 = require("./TreeBuilder");
Object.defineProperty(exports, "HTMLTreeBuilder", { enumerable: true, get: function () { return TreeBuilder_1.HTMLTreeBuilder; } });
var Token_1 = require("./Token");
Object.defineProperty(exports, "TokenType", { enumerable: true, get: function () { return Token_1.TokenType; } });
//# sourceMappingURL=index.js.map