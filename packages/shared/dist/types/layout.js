"use strict";
/**
 * 布局类型定义
 *
 * 对应 Chrome/Blink 中的 third_party/blink/renderer/core/layout/
 * 定义了布局盒子的结构和样式计算后的类型
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LayoutMode = void 0;
// ============================================================
// 布局模式 —— 决定使用哪种布局算法
// ============================================================
var LayoutMode;
(function (LayoutMode) {
    LayoutMode["BLOCK"] = "block";
    LayoutMode["INLINE"] = "inline";
    LayoutMode["FLEX"] = "flex";
})(LayoutMode || (exports.LayoutMode = LayoutMode = {}));
//# sourceMappingURL=layout.js.map