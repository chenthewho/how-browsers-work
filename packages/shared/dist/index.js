"use strict";
/**
 * @browser/shared — 共享类型定义
 *
 * 所有其他模块都依赖这个包中的类型定义。
 * 包括 DOM 类型、CSS 类型、布局类型、IPC 消息类型、网络类型。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LayoutMode = exports.StyleOrigin = exports.NodeType = void 0;
var dom_1 = require("./types/dom");
Object.defineProperty(exports, "NodeType", { enumerable: true, get: function () { return dom_1.NodeType; } });
var css_1 = require("./types/css");
Object.defineProperty(exports, "StyleOrigin", { enumerable: true, get: function () { return css_1.StyleOrigin; } });
var layout_1 = require("./types/layout");
Object.defineProperty(exports, "LayoutMode", { enumerable: true, get: function () { return layout_1.LayoutMode; } });
//# sourceMappingURL=index.js.map