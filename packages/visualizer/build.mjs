/**
 * esbuild 构建脚本
 * 把浏览器渲染管线打包为单个 IIFE，挂到 window.Browser
 */
import * as esbuild from 'esbuild';

const isWatch = process.argv.includes('--watch');

const opts = {
  entryPoints: ['bundle.ts'],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  globalName: 'Browser',
  outfile: 'public/bundle.js',
  tsconfig: 'tsconfig.json',
  resolveExtensions: ['.ts', '.js'],
  // 解析 @browser/* 包名
  alias: {
    '@browser/shared': '../shared/src/index.ts',
    '@browser/dom': '../dom/src/index.ts',
    '@browser/html-parser': '../html-parser/src/index.ts',
    '@browser/css-parser': '../css-parser/src/index.ts',
    '@browser/style': '../style/src/index.ts',
    '@browser/layout': '../layout/src/index.ts',
    '@browser/renderer-process': '../renderer-process/src/index.ts',
    '@browser/output': '../output/src/index.ts',
  },
  // 排除 Node.js 专用模块（如果 pipeline 中有引用）
  external: ['http', 'https', 'fs', 'path', 'child_process', 'url'],
};

if (isWatch) {
  const ctx = await esbuild.context(opts);
  await ctx.watch();
  console.log('👀 Watching for changes...');
} else {
  await esbuild.build(opts);
  console.log('✅ Bundle built: public/bundle.js');
}
