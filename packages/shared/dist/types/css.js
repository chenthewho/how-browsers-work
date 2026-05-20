"use strict";
/**
 * CSS 类型定义
 *
 * 对应 Chrome/Blink 中的 third_party/blink/renderer/core/css/
 * 定义了 CSS 解析后的 AST 结构，以及样式表的表示
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleOrigin = void 0;
// ============================================================
// 样式来源 —— 决定层叠优先级
// 对应 CSS 规范中的 origin，Chrome 中由 StyleSheetContents 管理
// 优先级（从高到低）：
//   用户代理 !important > 用户 !important > 作者 !important >
//   作者普通 > 用户普通 > 用户代理普通
// ============================================================
var StyleOrigin;
(function (StyleOrigin) {
    StyleOrigin["USER_AGENT"] = "user-agent";
    StyleOrigin["AUTHOR"] = "author";
    StyleOrigin["USER"] = "user";
})(StyleOrigin || (exports.StyleOrigin = StyleOrigin = {}));
//# sourceMappingURL=css.js.map