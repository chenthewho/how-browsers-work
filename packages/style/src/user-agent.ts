/**
 * 用户代理样式表（User-Agent Stylesheet）
 *
 * 对应 Chrome 中的 html.css（Chromium 内置的用户代理样式）
 * 文件路径：third_party/blink/renderer/core/html/resources/html.css
 *
 * 用户代理样式表为 HTML 元素提供默认样式。
 * 这些样式的优先级最低（StyleOrigin.USER_AGENT），
 * 可以被网页作者的样式覆盖。
 *
 * 以下是一些关键默认样式：
 *   - div, p, h1-h6 → display: block
 *   - span, a, strong, em → display: inline
 *   - head, script, style, title → display: none
 *   - body → margin: 8px
 *   - h1 → font-size: 2em; font-weight: bold
 */

export const USER_AGENT_CSS = `
html, body { display: block; }

head { display: none; }
title { display: none; }
meta { display: none; }
link { display: none; }
style { display: none; }
script { display: none; }

body { margin: 8px; }

div { display: block; }
p { display: block; margin: 1em 0; }
h1 { display: block; font-size: 2em; margin: 0.67em 0; font-weight: bold; }
h2 { display: block; font-size: 1.5em; margin: 0.83em 0; font-weight: bold; }
h3 { display: block; font-size: 1.17em; margin: 1em 0; font-weight: bold; }
h4 { display: block; font-size: 1em; margin: 1.33em 0; font-weight: bold; }
h5 { display: block; font-size: 0.83em; margin: 1.67em 0; font-weight: bold; }
h6 { display: block; font-size: 0.67em; margin: 2.33em 0; font-weight: bold; }

ul, ol { display: block; margin: 1em 0; padding-left: 40px; }
li { display: list-item; }
dl { display: block; margin: 1em 0; }
dt { display: block; }
dd { display: block; margin-left: 40px; }

table { display: table; }
thead { display: table-header-group; }
tbody { display: table-row-group; }
tfoot { display: table-footer-group; }
tr { display: table-row; }
td, th { display: table-cell; }

span { display: inline; }
a { display: inline; color: blue; text-decoration: underline; }
strong { display: inline; font-weight: bold; }
em { display: inline; font-style: italic; }
img { display: inline-block; }
br { display: inline; }

hr { display: block; margin: 0.5em 0; border-width: 1px 0 0 0; }

pre { display: block; margin: 1em 0; white-space: pre; font-family: monospace; }
code { font-family: monospace; }
blockquote { display: block; margin: 1em 40px; }

form { display: block; }
input { display: inline-block; }
button { display: inline-block; }
textarea { display: inline-block; }
select { display: inline-block; }

section, article, aside, nav, header, footer, main, figure, figcaption {
  display: block;
}

details { display: block; }
summary { display: block; }
`;
