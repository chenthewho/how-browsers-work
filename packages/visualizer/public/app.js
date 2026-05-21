/**
 * 可视化前端 — Chrome DevTools 风格
 * 依赖 window.Browser（由 esbuild 打包的渲染管线）
 */

// ============================================================
// 全局状态
// ============================================================
const state = {
  document: null,        // DOM Document
  layoutRoot: null,      // LayoutBox 树
  tokens: [],            // HTML Token 流
  cssRules: [],          // CSS 规则列表
  authorSheet: null,     // 作者样式表
  selectedElement: null, // 当前选中的元素
  selectedLayoutBox: null,// 当前选中的布局盒子
  zoom: 1,
  offsetX: 20,
  offsetY: 20,
};

// ============================================================
// DOM 元素引用
// ============================================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const htmlInput = $('#html-input');
const cssInput = $('#css-input');
const btnRender = $('#btn-render');
const domTreeEl = $('#dom-tree');
const tokenListEl = $('#token-list');
const cssRulesEl = $('#css-rules');
const canvas = $('#layout-canvas');
const ctx = canvas.getContext('2d');
const canvasPlaceholder = $('#canvas-placeholder');
const tooltip = $('#canvas-tooltip');
const elementInfo = $('#element-info');
const stylesPanel = $('#styles-panel');
const stylesList = $('#styles-list');
const boxModelPanel = $('#box-model-panel');
const boxModelCanvas = $('#box-model-canvas');
const boxModelCtx = boxModelCanvas.getContext('2d');
const boxModelValues = $('#box-model-values');
const statusText = $('#status-text');
const statusStats = $('#status-stats');

// ============================================================
// 渲染流水线
// ============================================================
async function render() {
  statusText.textContent = '渲染中...';
  const html = htmlInput.value;
  const css = cssInput.value;
  const vw = parseInt($('#input-width').value) || 800;
  const vh = parseInt($('#input-height').value) || 600;

  try {
    const B = window.Browser;

    // HTML Tokenizer
    const tokenizer = new B.HTMLTokenizer();
    state.tokens = tokenizer.tokenize(html);

    // CSS Parser
    const cssParser = new B.CSSParser();
    const uaSheet = cssParser.parse(B.USER_AGENT_CSS, B.StyleOrigin.USER_AGENT);
    state.authorSheet = cssParser.parse(css, B.StyleOrigin.AUTHOR);

    // Pipeline
    const pipeline = new B.RenderPipeline(vw, vh);
    const result = pipeline.render(html, [css]);
    state.document = result.document;
    state.layoutRoot = result.layoutRoot;

    // CSS Rules
    state.cssRules = state.authorSheet.rules;

    // 更新 UI
    renderDOMTree();
    renderTokens();
    renderCSSRules();
    renderLayoutCanvas();
    updateStatus();
    selectElement(null);

    statusText.textContent = '渲染完成';
  } catch (err) {
    statusText.textContent = '错误: ' + err.message;
    console.error(err);
  }
}

function updateStatus() {
  const B = window.Browser;
  const doc = state.document;
  if (!doc) return;

  let elCount = 0;
  function count(node) { elCount++; let c = node.firstChild; while (c) { if (c.nodeType === B.NodeType.ELEMENT_NODE) count(c); c = c.nextSibling; } }
  if (doc.documentElement) count(doc.documentElement);

  statusStats.textContent =
    `元素: ${elCount} | Token: ${state.tokens.length} | CSS 规则: ${state.cssRules.length} | 布局盒子: ${countBoxes(state.layoutRoot)}`;
}

function countBoxes(box) {
  if (!box) return 0;
  let n = 1;
  for (const c of box.children) n += countBoxes(c);
  return n;
}

// ============================================================
// DOM 树面板
// ============================================================
function renderDOMTree() {
  domTreeEl.innerHTML = '';
  const doc = state.document;
  if (!doc || !doc.documentElement) {
    domTreeEl.innerHTML = '<div class="placeholder">无 DOM 树</div>';
    return;
  }
  buildDOMNode(doc.documentElement, domTreeEl, 0);
}

function buildDOMNode(element, parent, depth) {
  const div = document.createElement('div');
  div.className = 'dom-node';
  div.style.paddingLeft = (depth * 14 + 4) + 'px';
  div.dataset.boxId = element._boxId; // 关联布局盒子

  // 统计子元素（一趟扫描完成）
  let elChildren = 0;
  let c = element.firstChild;
  while (c) {
    if (c.nodeType === 1) elChildren++;
    c = c.nextSibling;
  }
  const hasChildren = elChildren > 0;

  const expand = document.createElement('span');
  expand.className = 'expand';
  expand.textContent = hasChildren ? '▶' : ' ';
  div.appendChild(expand);

  // 标签名
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = `<${element.tagName.toLowerCase()}>`;
  div.appendChild(tag);

  // ID / class
  if (element.id) {
    const attr = document.createElement('span');
    attr.className = 'attr';
    attr.textContent = ` #${element.id}`;
    div.appendChild(attr);
  }
  if (element.className) {
    const attr = document.createElement('span');
    attr.className = 'attr';
    attr.textContent = ` .${element.className.replace(/\s+/g, '.')}`;
    div.appendChild(attr);
  }

  // 文本内容预览
  const text = getDirectText(element);
  if (text) {
    const t = document.createElement('span');
    t.className = 'text';
    t.textContent = ` "${text.substring(0, 40)}"`;
    div.appendChild(t);
  }

  // 显示子元素数量
  if (elChildren > 0 && !text) {
    const count = document.createElement('span');
    count.className = 'text';
    count.textContent = ` ${elChildren} 个子元素`;
    div.appendChild(count);
  }

  div.addEventListener('click', (e) => {
    e.stopPropagation();
    selectElement(element);
    expandToggle(div, element, depth);
  });

  parent.appendChild(div);

  // 递归子元素
  c = element.firstChild;
  while (c) {
    if (c.nodeType === 1) {
      buildDOMNode(c, parent, depth + 1);
    }
    c = c.nextSibling;
  }
}

function expandToggle(div, element, depth) {
  // TODO: 折叠/展开子元素
}

function getDirectText(el) {
  let text = '';
  let c = el.firstChild;
  while (c) {
    if (c.nodeType === 3 && c.textContent.trim()) text += c.textContent.trim();
    c = c.nextSibling;
  }
  return text.substring(0, 60);
}

// ============================================================
// Token 流面板
// ============================================================
function renderTokens() {
  tokenListEl.innerHTML = '';
  for (const token of state.tokens) {
    const div = document.createElement('div');
    div.className = 'token-item';

    const type = document.createElement('span');
    type.className = `type-${token.type}`;
    type.textContent = token.type.padEnd(10);

    const detail = document.createElement('span');
    if (token.tagName) {
      detail.textContent = token.type === 'EndTag' ? `</${token.tagName}>` : `<${token.tagName}>`;
      if (token.attributes && token.attributes.length > 0) {
        detail.textContent += ' ' + token.attributes.map(a => `${a.name}="${a.value}"`).join(' ');
      }
    } else if (token.data) {
      detail.textContent = token.data.substring(0, 60);
    }
    detail.style.marginLeft = '8px';

    div.appendChild(type);
    div.appendChild(detail);
    tokenListEl.appendChild(div);
  }
}

// ============================================================
// CSS 规则面板
// ============================================================
function renderCSSRules() {
  cssRulesEl.innerHTML = '';
  for (const rule of state.cssRules) {
    const div = document.createElement('div');
    div.className = 'css-rule';

    const sel = document.createElement('span');
    sel.className = 'selector';
    sel.textContent = rule.selectors.map(s => formatSelector(s)).join(', ');

    const spec = document.createElement('span');
    spec.className = 'specificity';
    spec.textContent = ` [${rule.selectors[0]?.specificity?.join(',') || '0,0,0'}]`;
    sel.appendChild(spec);

    div.appendChild(sel);

    for (const decl of rule.declarations) {
      const d = document.createElement('span');
      d.className = 'decl';
      d.innerHTML = `<span class="prop">${decl.property}</span>: <span class="val">${formatValue(decl.value)}</span>`;
      div.appendChild(d);
    }
    cssRulesEl.appendChild(div);
  }
}

function formatSelector(sel) {
  const parts = sel.compounds.map(c => {
    let s = c.tagName || '*';
    if (c.id) s += '#' + c.id;
    s += c.classes.map(cl => '.' + cl).join('');
    if (c.attributes && c.attributes.length) s += c.attributes.map(a => `[${a.name}${a.operator||''}${a.value||''}]`).join('');
    if (c.pseudoClasses && c.pseudoClasses.length) s += c.pseudoClasses.map(p => `:${p.name}`).join('');
    return s;
  });
  if (!sel.combinators || sel.combinators.length === 0) return parts.join(', ');
  const map = {descendant:' ', child:' > ', 'adjacent-sibling':' + ', 'general-sibling':' ~ '};
  let result = parts[0];
  for (let i = 0; i < sel.combinators.length; i++) {
    result += map[sel.combinators[i]] + parts[i + 1];
  }
  return result;
}

function formatValue(v) {
  if (!v) return '';
  if (v.type === 'color') return `rgba(${v.r},${v.g},${v.b},${v.a})`;
  if (v.type === 'length') return `${v.value}${v.unit}`;
  if (v.type === 'keyword') return v.value;
  return JSON.stringify(v);
}

// ============================================================
// 布局画布 — Canvas 渲染
// ============================================================
function renderLayoutCanvas() {
  if (!state.layoutRoot) return;

  canvasPlaceholder.classList.add('hidden');
  canvas.style.display = 'block';

  // 计算画布尺寸
  const root = state.layoutRoot;
  const totalW = root.rect.width + 80;
  const totalH = root.rect.height + 80;
  canvas.width = Math.max(900, totalW);
  canvas.height = Math.max(700, totalH);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 白色背景
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 视口边框
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;
  ctx.strokeRect(state.offsetX - 1, state.offsetY - 1, root.rect.width + 2, root.rect.height + 2);

  // 递归渲染布局盒子
  renderBox(root, state.offsetX, state.offsetY);

  // 关联每个盒子的 canvas 坐标（用于鼠标交互）
  state._boxCoords = new Map();
  collectBoxCoords(root, state.offsetX, state.offsetY);
}

function renderBox(box, parentX, parentY) {
  const x = parentX + box.rect.x;
  const y = parentY + box.rect.y;
  const w = box.rect.width;
  const h = box.rect.height;

  // 确定颜色
  const tagColors = {
    html: '#e0e0e0', body: '#bbdefb', div: '#c8e6c9', p: '#fff9c4',
    h1: '#e1bee7', h2: '#e1bee7', h3: '#e1bee7', h4: '#e1bee7', h5: '#e1bee7', h6: '#e1bee7',
    span: '#ffe0b2', strong: '#ffcdd2', em: '#ffcdd2',
    ul: '#b2ebf2', ol: '#b2ebf2', li: '#b2ebf2',
  };
  const tag = box.element ? box.element.tagName.toLowerCase() : 'text';
  const color = tagColors[tag] || '#f5f5f5';

  // 文本盒子：虚线边框
  if (box.textContent) {
    ctx.strokeStyle = '#999';
    ctx.setLineDash([3, 2]);
    ctx.strokeRect(x, y, Math.max(w, 2), Math.max(h, 2));
    ctx.setLineDash([]);

    // 文本标签
    ctx.fillStyle = '#666';
    ctx.font = `${Math.max(9, Math.min(h - 2, 12))}px sans-serif`;
    const label = box.textContent.substring(0, 30);
    if (label && w > 10 && h > 5) {
      ctx.fillText(label, x + 1, y + h / 2 + 3, w - 2);
    }
    return;
  }

  // 盒模型四层绘制
  // margin
  if (box.margin.top > 0 || box.margin.right > 0 || box.margin.bottom > 0 || box.margin.left > 0) {
    ctx.fillStyle = 'rgba(212,212,212,0.2)';
    ctx.fillRect(x - box.margin.left, y - box.margin.top,
      w + box.margin.left + box.margin.right,
      h + box.margin.top + box.margin.bottom);
  }

  // border
  if (box.border.top > 0 || box.border.right > 0 || box.border.bottom > 0 || box.border.left > 0) {
    ctx.fillStyle = 'rgba(206,145,120,0.35)';
    ctx.fillRect(
      x - box.padding.left - box.border.left,
      y - box.padding.top - box.border.top,
      w + box.padding.left + box.padding.right + box.border.left + box.border.right,
      h + box.padding.top + box.padding.bottom + box.border.top + box.border.bottom
    );
  }

  // padding
  if (box.padding.top > 0 || box.padding.right > 0 || box.padding.bottom > 0 || box.padding.left > 0) {
    ctx.fillStyle = 'rgba(106,153,85,0.3)';
    ctx.fillRect(x - box.padding.left, y - box.padding.top,
      w + box.padding.left + box.padding.right,
      h + box.padding.top + box.padding.bottom);
  }

  // content
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);

  // 边框
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x, y, w, h);

  // 标签
  if (w > 30 && h > 10) {
    ctx.fillStyle = '#333';
    ctx.font = '10px sans-serif';
    let label = tag;
    if (box.element) {
      if (box.element.id) label += '#' + box.element.id;
      else if (box.element.className) label += '.' + box.element.className.replace(/\s+/g, '.');
    }
    ctx.fillText(label, x + 3, y + 12, w - 6);
  }

  // 递归子盒子
  for (const child of box.children) {
    renderBox(child, x + box.padding.left, y + box.padding.top);
  }
}

function collectBoxCoords(box, parentX, parentY) {
  if (!box) return;
  const x = parentX + box.rect.x;
  const y = parentY + box.rect.y;
  state._boxCoords.set(box, { x, y, w: box.rect.width, h: box.rect.height });
  for (const child of box.children) {
    collectBoxCoords(child, x + box.padding.left, y + box.padding.top);
  }
}

// ============================================================
// Canvas 鼠标交互
// ============================================================
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  // 找鼠标下的盒子（从最上层开始）
  let found = null;
  for (const [box, coords] of state._boxCoords) {
    if (mx >= coords.x && mx <= coords.x + coords.w &&
        my >= coords.y && my <= coords.y + coords.h) {
      found = { box, coords };
    }
  }

  if (found) {
    const tag = found.box.element ? found.box.element.tagName.toLowerCase() : 'text';
    const id = found.box.element?.id ? '#' + found.box.element.id : '';
    const cls = found.box.element?.className ? '.' + found.box.element.className.replace(/\s+/g, '.') : '';
    const size = `${found.box.rect.width.toFixed(0)}×${found.box.rect.height.toFixed(0)}`;
    tooltip.innerHTML = `<span class="tag">${tag}</span>${id}${cls} <span style="color:#999">${size}</span>`;
    tooltip.style.left = (mx + 15) + 'px';
    tooltip.style.top = (my - 25) + 'px';
    tooltip.classList.remove('hidden');
  } else {
    tooltip.classList.add('hidden');
  }
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  let found = null;
  for (const [box, coords] of state._boxCoords) {
    if (mx >= coords.x && mx <= coords.x + coords.w &&
        my >= coords.y && my <= coords.y + coords.h) {
      found = box;
    }
  }

  if (found && found.element) {
    selectElement(found.element);
    state.selectedLayoutBox = found;
  }
});

// ============================================================
// 元素选中 → 右侧详情
// ============================================================
function selectElement(element) {
  state.selectedElement = element;

  // 更新 DOM 树选中状态
  $$('.dom-node.selected').forEach(el => el.classList.remove('selected'));
  // TODO: 通过 boxId 关联选中

  if (!element) {
    elementInfo.classList.remove('hidden');
    stylesPanel.classList.add('hidden');
    boxModelPanel.classList.add('hidden');
    elementInfo.innerHTML = '<div class="placeholder">选择一个元素查看详情</div>';
    return;
  }

  elementInfo.classList.add('hidden');
  stylesPanel.classList.remove('hidden');
  boxModelPanel.classList.remove('hidden');

  // 元素信息
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const cls = element.className ? `.${element.className.replace(/\s+/g, '.')}` : '';
  elementInfo.innerHTML = `<div class="info-tag">&lt;<span class="tag">${tag}</span>${id}${cls}&gt;</div>`;

  // Styles
  renderStylesPanel(element);
  // Box Model
  renderBoxModel(element);
}

function renderStylesPanel(element) {
  stylesList.innerHTML = '';
  if (!element.computedStyle) return;

  const B = window.Browser;
  const cs = element.computedStyle;
  const props = [
    ['display', cs.display],
    ['width', cs.width],
    ['height', cs.height],
    ['margin', `${cs.marginTop} ${cs.marginRight} ${cs.marginBottom} ${cs.marginLeft}`],
    ['padding', `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`],
    ['border', `${cs.borderTopWidth} ${cs.borderRightWidth} ${cs.borderBottomWidth} ${cs.borderLeftWidth}`],
    ['font-size', cs.fontSize + 'px'],
    ['font-weight', cs.fontWeight],
    ['color', `rgba(${cs.color.r},${cs.color.g},${cs.color.b},${cs.color.a})`],
    ['background-color', cs.backgroundColor ? `rgba(${cs.backgroundColor.r},${cs.backgroundColor.g},${cs.backgroundColor.b},${cs.backgroundColor.a})` : 'transparent'],
    ['position', cs.position],
    ['text-align', cs.textAlign],
    ['line-height', cs.lineHeight + 'px'],
    ['opacity', cs.opacity],
    ['z-index', cs.zIndex],
  ];

  // 作者样式规则（当前元素匹配的）
  const authorRule = document.createElement('div');
  authorRule.className = 'styles-rule';
  authorRule.innerHTML = '<div class="rule-selector">element.style <span class="rule-source">内联</span></div>';
  if (element.style && element.style.cssText) {
    const prop = document.createElement('div');
    prop.className = 'styles-prop';
    prop.innerHTML = `<span class="prop-name">cssText</span><span class="prop-val">${element.style.cssText}</span>`;
    authorRule.appendChild(prop);
  }
  stylesList.appendChild(authorRule);

  // 匹配的 CSS 规则
  if (state.authorSheet) {
    for (const rule of state.authorSheet.rules) {
      for (const sel of rule.selectors) {
        try {
          if (B.matchesSelector(sel, element)) {
            const ruleDiv = document.createElement('div');
            ruleDiv.className = 'styles-rule';
            ruleDiv.innerHTML = `<div class="rule-selector">${formatSelector(sel)} <span class="rule-source">[${sel.specificity.join(',')}]</span></div>`;
            for (const decl of rule.declarations) {
              const pd = document.createElement('div');
              pd.className = 'styles-prop';
              pd.innerHTML = `<span class="prop-name">${decl.property}</span><span class="prop-val">${formatValue(decl.value)}${decl.important ? ' !important' : ''}</span>`;
              ruleDiv.appendChild(pd);
            }
            stylesList.appendChild(ruleDiv);
          }
        } catch(e) {}
      }
    }
  }

  // 计算样式（所有属性）
  const compDiv = document.createElement('div');
  compDiv.className = 'styles-rule';
  compDiv.innerHTML = '<div class="rule-selector">Computed <span class="rule-source">计算后的值</span></div>';
  for (const [prop, val] of props) {
    const pd = document.createElement('div');
    pd.className = 'styles-prop';
    pd.innerHTML = `<span class="prop-name">${prop}:</span><span class="prop-val">${val}</span>`;
    compDiv.appendChild(pd);
  }
  stylesList.appendChild(compDiv);
}

function renderBoxModel(element) {
  if (!element.computedStyle) return;

  const cs = element.computedStyle;
  const margin = { t: cs.marginTop || 0, r: cs.marginRight || 0, b: cs.marginBottom || 0, l: cs.marginLeft || 0 };
  const border = { t: cs.borderTopWidth || 0, r: cs.borderRightWidth || 0, b: cs.borderBottomWidth || 0, l: cs.borderLeftWidth || 0 };
  const padding = { t: cs.paddingTop || 0, r: cs.paddingRight || 0, b: cs.paddingBottom || 0, l: cs.paddingLeft || 0 };

  const cw = 240, ch = 240;
  boxModelCtx.clearRect(0, 0, cw, ch);

  // 居中计算
  const scale = 1.5;
  const centerX = cw / 2;
  const centerY = ch / 2;
  const contentW = 60 * scale;
  const contentH = 40 * scale;

  function drawLayer(offX, offY, w, h, color, label) {
    boxModelCtx.fillStyle = color;
    boxModelCtx.fillRect(offX, offY, w, h);
    boxModelCtx.strokeStyle = '#555';
    boxModelCtx.lineWidth = 0.5;
    boxModelCtx.strokeRect(offX, offY, w, h);
    // 标签
    boxModelCtx.fillStyle = '#fff';
    boxModelCtx.font = '9px sans-serif';
    if (w > 40 && h > 12) boxModelCtx.fillText(label, offX + 3, offY + 12);
  }

  // margin (outermost)
  const mx = centerX - (contentW + (padding.l + padding.r + border.l + border.r + margin.l + margin.r) * scale) / 2;
  const my = centerY - (contentH + (padding.t + padding.b + border.t + border.b + margin.t + margin.b) * scale) / 2;
  const mw = contentW + (padding.l + padding.r + border.l + border.r + margin.l + margin.r) * scale;
  const mh = contentH + (padding.t + padding.b + border.t + border.b + margin.t + margin.b) * scale;
  drawLayer(mx, my, mw, mh, '#d4b896', 'margin');

  // border
  const bx = mx + margin.l * scale;
  const by = my + margin.t * scale;
  const bw = contentW + (padding.l + padding.r + border.l + border.r) * scale;
  const bh = contentH + (padding.t + padding.b + border.t + border.b) * scale;
  drawLayer(bx, by, bw, bh, '#f0c070', 'border');

  // padding
  const px = bx + border.l * scale;
  const py = by + border.t * scale;
  const pw = contentW + (padding.l + padding.r) * scale;
  const ph = contentH + (padding.t + padding.b) * scale;
  drawLayer(px, py, pw, ph, '#90c890', 'padding');

  // content
  const cx = px + padding.l * scale;
  const cy = py + padding.t * scale;
  drawLayer(cx, cy, contentW, contentH, '#80b8e8', `${cs.width}×${cs.height}`);

  // 数值标注
  boxModelValues.innerHTML = `
    margin:  ${margin.t} ${margin.r} ${margin.b} ${margin.l}<br>
    border:  ${border.t} ${border.r} ${border.b} ${border.l}<br>
    padding: ${padding.t} ${padding.r} ${padding.b} ${padding.l}<br>
    content: ${cs.width} × ${cs.height === 'auto' ? 'auto' : cs.height}
  `;
}

// ============================================================
// 事件绑定
// ============================================================
btnRender.addEventListener('click', render);

// Tab 切换
document.querySelectorAll('.panel-tabs .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.panel-tabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    if (target === 'dom') { domTreeEl.classList.remove('hidden'); tokenListEl.classList.add('hidden'); cssRulesEl.classList.add('hidden'); }
    if (target === 'tokens') { domTreeEl.classList.add('hidden'); tokenListEl.classList.remove('hidden'); cssRulesEl.classList.add('hidden'); }
    if (target === 'rules') { domTreeEl.classList.add('hidden'); tokenListEl.classList.add('hidden'); cssRulesEl.classList.remove('hidden'); }
  });
});

// 源码面板折叠
$('#btn-toggle-source').addEventListener('click', () => {
  $('#source-panel').classList.toggle('collapsed');
  $('#btn-toggle-source').textContent = $('#source-panel').classList.contains('collapsed') ? '▼' : '▲';
});

// 缩放按钮
$('#btn-zoom-in').addEventListener('click', () => { state.zoom *= 1.2; renderLayoutCanvas(); });
$('#btn-zoom-out').addEventListener('click', () => { state.zoom *= 0.8; renderLayoutCanvas(); });
$('#btn-reset').addEventListener('click', () => { state.zoom = 1; state.offsetX = 20; state.offsetY = 20; renderLayoutCanvas(); });

// 视口尺寸改变时重新渲染
$('#input-width').addEventListener('change', render);
$('#input-height').addEventListener('change', render);

// ============================================================
// 面板拖拽调整大小
// ============================================================
(function() {
  const L = $('#left-panel');
  const R = $('#right-panel');
  const C = $('#center-panel');
  const S = $('#source-panel');
  const w = $('#workspace');

  let dragState = null;
  let overlay = null;

  function startDrag(e, type, target) {
    e.preventDefault();
    dragState = { type, startX: e.clientX, startY: e.clientY };

    if (type === 'col') {
      const leftW = L.offsetWidth;
      const rightW = R.offsetWidth;
      dragState.leftW = leftW;
      dragState.rightW = rightW;
      if (target === 'left') dragState.side = 'left';
      else dragState.side = 'right';
    } else if (type === 'row') {
      dragState.sourceH = S.offsetHeight;
    }

    // 覆盖层防止 canvas 吞掉 mousemove 事件
    overlay = document.createElement('div');
    overlay.className = type === 'row' ? 'resize-overlay row' : 'resize-overlay';
    document.body.appendChild(overlay);

    const h = document.getElementById(target === 'left' ? 'resize-left' : target === 'right' ? 'resize-right' : 'resize-source');
    if (h) h.classList.add('active');
  }

  function onMove(e) {
    if (!dragState) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    if (dragState.type === 'col') {
      if (dragState.side === 'left') {
        const newW = Math.max(160, Math.min(500, dragState.leftW + dx));
        L.style.width = newW + 'px';
      } else {
        // 拖右边：右侧面板变宽 = 左侧空间变小
        const newW = Math.max(160, Math.min(500, dragState.rightW - dx));
        R.style.width = newW + 'px';
      }
    } else if (dragState.type === 'row') {
      const newH = Math.max(80, Math.min(400, dragState.sourceH + dy));
      S.style.height = newH + 'px';
      S.style.flexBasis = newH + 'px';
      S.style.flexShrink = '0';
    }
  }

  function stopDrag() {
    if (!dragState) return;
    const h = document.getElementById(
      dragState.type === 'col'
        ? (dragState.side === 'left' ? 'resize-left' : 'resize-right')
        : 'resize-source'
    );
    if (h) h.classList.remove('active');
    if (overlay) { overlay.remove(); overlay = null; }
    dragState = null;
  }

  // 左右拖拽手柄
  ['resize-left', 'resize-right'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('mousedown', e => startDrag(e, 'col', id === 'resize-left' ? 'left' : 'right'));
    }
  });

  // 源码面板拖拽手柄
  const elS = document.getElementById('resize-source');
  if (elS) {
    elS.addEventListener('mousedown', e => startDrag(e, 'row', 'source'));
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', stopDrag);
})();

// 初始渲染
setTimeout(render, 300);
