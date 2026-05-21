/**
 * @browser/js-engine — JavaScript 引擎集成
 *
 * 对应 Chrome 中的 V8 绑定层
 *
 * 使用 Node.js vm 模块创建隔离的 JS 执行环境，
 * 暴露 DOM API 给脚本使用。
 */
export { ScriptRunner } from './ScriptRunner';
export { createDOMBindings } from './DOMBindings';
