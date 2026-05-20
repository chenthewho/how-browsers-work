"use strict";
/**
 * @browser/css-parser — CSS 解析器
 *
 * 对应 Chrome/Blink 的 third_party/blink/renderer/core/css/parser/
 *
 * 将 CSS 字符串解析为结构化的样式表对象。
 * 包含词法分析器、语法分析器和选择器解析器。
 *
 * 主要导出：
 *   - CSSParser：解析器入口
 *   - CSSTokenizer：词法分析器
 *   - SelectorParser：选择器解析器
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectorParser = exports.CSSTokenType = exports.CSSTokenizer = exports.CSSParser = void 0;
var CSSParser_1 = require("./CSSParser");
Object.defineProperty(exports, "CSSParser", { enumerable: true, get: function () { return CSSParser_1.CSSParser; } });
var CSSTokenizer_1 = require("./CSSTokenizer");
Object.defineProperty(exports, "CSSTokenizer", { enumerable: true, get: function () { return CSSTokenizer_1.CSSTokenizer; } });
Object.defineProperty(exports, "CSSTokenType", { enumerable: true, get: function () { return CSSTokenizer_1.CSSTokenType; } });
var SelectorParser_1 = require("./SelectorParser");
Object.defineProperty(exports, "SelectorParser", { enumerable: true, get: function () { return SelectorParser_1.SelectorParser; } });
//# sourceMappingURL=index.js.map